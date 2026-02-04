import { prisma, isDatabaseConnected } from '../config/prisma';
import { Rule } from '../types/rules';
import crypto from 'crypto';

/**
 * Service de gestion des Rule Packs avec Prisma
 */

interface RuleTemplate {
    ruleId: string;
    title: string;
    trigger: string;
    tileIndex?: number | null;
    conditions: any[];
    effects: { type: string; value: number | string; target: string }[];
    priority: number;
}

interface RulePackData {
    packId: string;
    name: string;
    description?: string;
    rules: RuleTemplate[];
    isDefault: boolean;
    isPublic: boolean;
    usageCount: number;
    tags: string[];
}

class RulePackService {
    /**
     * Crée un nouveau Rule Pack
     */
    async createRulePack(
        name: string,
        rules: Rule[],
        options: { description?: string; isPublic?: boolean; createdBy?: string; tags?: string[] } = {}
    ): Promise<RulePackData | null> {
        if (!await isDatabaseConnected()) {
            console.log('⚠️ [RulePackService] DB non connectée');
            return null;
        }

        try {
            const packId = crypto.randomUUID();
            const ruleTemplates: RuleTemplate[] = rules.map(r => ({
                ruleId: r.id,
                title: r.title || 'Règle sans titre',
                trigger: r.trigger,
                tileIndex: r.tileIndex ?? null,
                conditions: r.conditions || [],
                effects: r.effects.map(e => ({
                    type: e.type,
                    value: e.value,
                    target: e.target,
                })),
                priority: r.priority,
            }));

            const pack = await prisma.rulePack.create({
                data: {
                    packId,
                    name: name.trim(),
                    description: options.description?.trim(),
                    rules: ruleTemplates as any,
                    isPublic: options.isPublic ?? false,
                    createdBy: options.createdBy,
                    tags: options.tags || [],
                },
            });

            console.log(`📦 [RulePackService] Pack "${name}" créé avec ${rules.length} règles`);

            return {
                packId: pack.packId,
                name: pack.name,
                description: pack.description || undefined,
                rules: pack.rules as unknown as RuleTemplate[],
                isDefault: pack.isDefault,
                isPublic: pack.isPublic,
                usageCount: pack.usageCount,
                tags: pack.tags,
            };
        } catch (error) {
            console.error('❌ [RulePackService] Erreur création pack:', error);
            return null;
        }
    }

    /**
     * Récupère un Rule Pack par son ID
     */
    async getRulePackById(packId: string): Promise<RulePackData | null> {
        // Vérifier d'abord les packs par défaut
        const defaultPack = this.getDefaultPacks().find(p => p.packId === packId);
        if (defaultPack) return defaultPack;

        if (!await isDatabaseConnected()) return null;

        try {
            const pack = await prisma.rulePack.findUnique({ where: { packId } });
            if (!pack) return null;

            return {
                packId: pack.packId,
                name: pack.name,
                description: pack.description || undefined,
                rules: pack.rules as unknown as RuleTemplate[],
                isDefault: pack.isDefault,
                isPublic: pack.isPublic,
                usageCount: pack.usageCount,
                tags: pack.tags,
            };
        } catch (error) {
            console.error('❌ [RulePackService] Erreur récupération pack:', error);
            return null;
        }
    }

    /**
     * Récupère tous les Rule Packs publics
     */
    async getPublicRulePacks(): Promise<RulePackData[]> {
        const defaults = this.getDefaultPacks();

        if (!await isDatabaseConnected()) {
            return defaults;
        }

        try {
            const packs = await prisma.rulePack.findMany({
                where: { isPublic: true },
                orderBy: { usageCount: 'desc' },
                take: 20,
            });

            const dbPacks: RulePackData[] = packs.map(p => ({
                packId: p.packId,
                name: p.name,
                description: p.description || undefined,
                rules: p.rules as unknown as RuleTemplate[],
                isDefault: p.isDefault,
                isPublic: p.isPublic,
                usageCount: p.usageCount,
                tags: p.tags,
            }));

            return [...defaults, ...dbPacks];
        } catch (error) {
            console.error('❌ [RulePackService] Erreur liste packs:', error);
            return defaults;
        }
    }

    /**
     * Incrémente le compteur d'utilisation
     */
    async incrementUsageCount(packId: string): Promise<void> {
        if (!await isDatabaseConnected()) return;

        try {
            await prisma.rulePack.update({
                where: { packId },
                data: { usageCount: { increment: 1 } },
            });
        } catch (error) {
            // Pack par défaut non en DB, ignorer
        }
    }

    /**
     * Convertit un pack en règles pour le jeu
     */
    convertPackToRules(pack: RulePackData): Rule[] {
        return pack.rules.map(r => ({
            id: crypto.randomUUID(),
            title: r.title,
            trigger: r.trigger as any,
            tileIndex: r.tileIndex ?? undefined,
            conditions: r.conditions || [],
            effects: r.effects.map(e => ({
                type: e.type,
                value: e.value,
                target: e.target as 'self' | 'all' | 'others' | 'random' | 'leader' | 'last',
            })),
            priority: r.priority,
        }));
    }

    /**
     * Supprime un Rule Pack
     */
    async deleteRulePack(packId: string): Promise<boolean> {
        if (!await isDatabaseConnected()) return false;

        try {
            await prisma.rulePack.delete({ where: { packId } });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Packs par défaut (hardcodés)
     */
    getDefaultPacks(): RulePackData[] {
        return [
            {
                packId: 'default-vanilla',
                name: 'Vanilla',
                description: 'Aucune règle spéciale - jeu pur',
                rules: [],
                isDefault: true,
                isPublic: true,
                usageCount: 100,
                tags: ['simple', 'débutant'],
            },
            {
                packId: 'default-classic',
                name: 'Classique',
                description: 'Quelques cases spéciales pour pimenter le jeu',
                rules: [
                    {
                        ruleId: 'turbo-5',
                        title: 'Turbo Boost',
                        trigger: 'ON_LAND',
                        tileIndex: 5,
                        conditions: [],
                        effects: [{ type: 'MOVE_RELATIVE', value: 2, target: 'self' }],
                        priority: 1,
                    },
                    {
                        ruleId: 'trap-10',
                        title: 'Piège',
                        trigger: 'ON_LAND',
                        tileIndex: 10,
                        conditions: [],
                        effects: [{ type: 'MOVE_RELATIVE', value: -3, target: 'self' }],
                        priority: 1,
                    },
                ],
                isDefault: true,
                isPublic: true,
                usageCount: 80,
                tags: ['classique', 'équilibré'],
            },
            {
                packId: 'default-chaos',
                name: 'Chaos',
                description: 'Téléportations et surprises à chaque coin !',
                rules: [
                    {
                        ruleId: 'teleport-5',
                        title: 'Téléporteur Alpha',
                        trigger: 'ON_LAND',
                        tileIndex: 5,
                        conditions: [],
                        effects: [{ type: 'TELEPORT', value: 15, target: 'self' }],
                        priority: 1,
                    },
                    {
                        ruleId: 'teleport-15',
                        title: 'Téléporteur Beta',
                        trigger: 'ON_LAND',
                        tileIndex: 15,
                        conditions: [],
                        effects: [{ type: 'TELEPORT', value: 3, target: 'self' }],
                        priority: 1,
                    },
                    {
                        ruleId: 'reset-10',
                        title: 'Retour Départ',
                        trigger: 'ON_LAND',
                        tileIndex: 10,
                        conditions: [],
                        effects: [{ type: 'BACK_TO_START', value: 0, target: 'self' }],
                        priority: 1,
                    },
                ],
                isDefault: true,
                isPublic: true,
                usageCount: 50,
                tags: ['chaos', 'fun', 'téléportation'],
            },
        ];
    }
}

export const rulePackService = new RulePackService();
export default rulePackService;
