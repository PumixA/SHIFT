import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma, isDatabaseConnected } from "../config/prisma"
import { emailService } from "./EmailService"

const SALT_ROUNDS = 10
const RESET_TOKEN_EXPIRY_HOURS = 1

export interface RegisterData {
  username: string
  email: string
  password: string
  avatarPreset?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  message: string
  user?: {
    id: string
    username: string
    email: string
    emailVerified: boolean
    avatarPreset: string | null
  }
}

class AuthService {
  /**
   * Register a new user with email and password
   */
  async register(data: RegisterData): Promise<AuthResult> {
    if (!(await isDatabaseConnected())) {
      return { success: false, message: "Service temporairement indisponible" }
    }

    try {
      // Validate input
      if (!data.email || !data.password || !data.username) {
        return { success: false, message: "Tous les champs sont requis" }
      }

      if (data.password.length < 6) {
        return { success: false, message: "Le mot de passe doit contenir au moins 6 caractères" }
      }

      if (data.username.length < 3 || data.username.length > 20) {
        return {
          success: false,
          message: "Le nom d'utilisateur doit contenir entre 3 et 20 caractères",
        }
      }

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })

      if (existingEmail) {
        return { success: false, message: "Cette adresse email est déjà utilisée" }
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username },
      })

      if (existingUsername) {
        return { success: false, message: "Ce nom d'utilisateur est déjà pris" }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

      // Create user
      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email.toLowerCase(),
          passwordHash,
          avatarPreset: data.avatarPreset || "default",
          profile: {
            create: {},
          },
        },
      })

      console.log(`[AuthService] User registered: ${data.email}`)

      return {
        success: true,
        message: "Compte créé avec succès",
        user: {
          id: user.id,
          username: user.username,
          email: user.email!,
          emailVerified: user.emailVerified,
          avatarPreset: user.avatarPreset,
        },
      }
    } catch (error) {
      console.error("[AuthService] Register error:", error)
      return { success: false, message: "Erreur lors de la création du compte" }
    }
  }

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<AuthResult> {
    if (!(await isDatabaseConnected())) {
      return { success: false, message: "Service temporairement indisponible" }
    }

    try {
      if (!data.email || !data.password) {
        return { success: false, message: "Email et mot de passe requis" }
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })

      if (!user || !user.passwordHash) {
        return { success: false, message: "Email ou mot de passe incorrect" }
      }

      // Verify password
      const isValid = await bcrypt.compare(data.password, user.passwordHash)

      if (!isValid) {
        return { success: false, message: "Email ou mot de passe incorrect" }
      }

      console.log(`[AuthService] User logged in: ${data.email}`)

      return {
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          username: user.username,
          email: user.email!,
          emailVerified: user.emailVerified,
          avatarPreset: user.avatarPreset,
        },
      }
    } catch (error) {
      console.error("[AuthService] Login error:", error)
      return { success: false, message: "Erreur lors de la connexion" }
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!(await isDatabaseConnected())) {
      return { success: false, message: "Service temporairement indisponible" }
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      // Always return success to prevent email enumeration
      if (!user) {
        console.log(`[AuthService] Password reset requested for unknown email: ${email}`)
        return {
          success: true,
          message: "Si cette adresse existe, un email de réinitialisation a été envoyé",
        }
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

      // Invalidate any existing tokens for this user
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      })

      // Create new reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // Send email
      await emailService.sendPasswordResetEmail(user.email!, user.username, token)

      console.log(`[AuthService] Password reset email sent to: ${email}`)

      return {
        success: true,
        message: "Si cette adresse existe, un email de réinitialisation a été envoyé",
      }
    } catch (error) {
      console.error("[AuthService] Forgot password error:", error)
      return { success: false, message: "Erreur lors de l'envoi de l'email" }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!(await isDatabaseConnected())) {
      return { success: false, message: "Service temporairement indisponible" }
    }

    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: "Le mot de passe doit contenir au moins 6 caractères" }
      }

      // Find valid token
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      })

      if (!resetToken) {
        return { success: false, message: "Lien de réinitialisation invalide" }
      }

      if (resetToken.used) {
        return { success: false, message: "Ce lien a déjà été utilisé" }
      }

      if (resetToken.expiresAt < new Date()) {
        return { success: false, message: "Ce lien a expiré. Veuillez en demander un nouveau." }
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        prisma.passwordReset.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ])

      console.log(`[AuthService] Password reset successful for user: ${resetToken.user.email}`)

      return { success: true, message: "Mot de passe modifié avec succès" }
    } catch (error) {
      console.error("[AuthService] Reset password error:", error)
      return { success: false, message: "Erreur lors de la réinitialisation du mot de passe" }
    }
  }

  /**
   * Validate reset token (for checking before showing reset form)
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    if (!(await isDatabaseConnected())) {
      return { valid: false, message: "Service temporairement indisponible" }
    }

    try {
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token },
      })

      if (!resetToken) {
        return { valid: false, message: "Lien invalide" }
      }

      if (resetToken.used) {
        return { valid: false, message: "Ce lien a déjà été utilisé" }
      }

      if (resetToken.expiresAt < new Date()) {
        return { valid: false, message: "Ce lien a expiré" }
      }

      return { valid: true }
    } catch (error) {
      console.error("[AuthService] Validate token error:", error)
      return { valid: false, message: "Erreur de validation" }
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!(await isDatabaseConnected())) {
      return { success: false, message: "Service temporairement indisponible" }
    }

    try {
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user || !user.passwordHash) {
        return { success: false, message: "Utilisateur non trouvé" }
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)

      if (!isValid) {
        return { success: false, message: "Mot de passe actuel incorrect" }
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      })

      console.log(`[AuthService] Password changed for user: ${userId}`)

      return { success: true, message: "Mot de passe modifié avec succès" }
    } catch (error) {
      console.error("[AuthService] Change password error:", error)
      return { success: false, message: "Erreur lors du changement de mot de passe" }
    }
  }
}

export const authService = new AuthService()
export default authService
