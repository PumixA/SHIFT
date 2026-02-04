/**
 * Gamepad Mappings - Support for game controllers
 */

export interface GamepadMapping {
  name: string;
  buttons: {
    rollDice: number;       // A button
    confirm: number;        // A button
    cancel: number;         // B button
    menu: number;           // Start button
    settings: number;       // Select button
    chat: number;           // Y button
    rules: number;          // X button
    nextPlayer: number;     // R1 button
    prevPlayer: number;     // L1 button
  };
  axes: {
    horizontal: number;     // Left stick X
    vertical: number;       // Left stick Y
    cameraX: number;        // Right stick X
    cameraY: number;        // Right stick Y
  };
  deadzone: number;
}

// Standard gamepad layout (Xbox-like)
export const STANDARD_MAPPING: GamepadMapping = {
  name: 'Standard',
  buttons: {
    rollDice: 0,    // A
    confirm: 0,     // A
    cancel: 1,      // B
    menu: 9,        // Start
    settings: 8,    // Select/Back
    chat: 3,        // Y
    rules: 2,       // X
    nextPlayer: 5,  // R1
    prevPlayer: 4   // L1
  },
  axes: {
    horizontal: 0,
    vertical: 1,
    cameraX: 2,
    cameraY: 3
  },
  deadzone: 0.15
};

// PlayStation layout
export const PLAYSTATION_MAPPING: GamepadMapping = {
  name: 'PlayStation',
  buttons: {
    rollDice: 0,    // Cross
    confirm: 0,     // Cross
    cancel: 1,      // Circle
    menu: 9,        // Options
    settings: 8,    // Share
    chat: 3,        // Triangle
    rules: 2,       // Square
    nextPlayer: 5,  // R1
    prevPlayer: 4   // L1
  },
  axes: {
    horizontal: 0,
    vertical: 1,
    cameraX: 2,
    cameraY: 3
  },
  deadzone: 0.15
};

// Nintendo Switch Pro Controller
export const SWITCH_MAPPING: GamepadMapping = {
  name: 'Nintendo Switch',
  buttons: {
    rollDice: 1,    // A (right position on Switch)
    confirm: 1,     // A
    cancel: 0,      // B
    menu: 9,        // +
    settings: 8,    // -
    chat: 2,        // X
    rules: 3,       // Y
    nextPlayer: 5,  // R
    prevPlayer: 4   // L
  },
  axes: {
    horizontal: 0,
    vertical: 1,
    cameraX: 2,
    cameraY: 3
  },
  deadzone: 0.15
};

/**
 * Detect gamepad type from ID string
 */
export function detectGamepadType(gamepadId: string): GamepadMapping {
  const id = gamepadId.toLowerCase();

  if (id.includes('playstation') || id.includes('dualshock') || id.includes('dualsense')) {
    return PLAYSTATION_MAPPING;
  }

  if (id.includes('nintendo') || id.includes('switch') || id.includes('pro controller')) {
    return SWITCH_MAPPING;
  }

  // Default to standard/Xbox mapping
  return STANDARD_MAPPING;
}

/**
 * Get button name for display
 */
export function getButtonName(mapping: GamepadMapping, action: keyof GamepadMapping['buttons']): string {
  const names: Record<string, Record<number, string>> = {
    'Standard': {
      0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 8: 'Back', 9: 'Start'
    },
    'PlayStation': {
      0: 'Cross', 1: 'Circle', 2: 'Square', 3: 'Triangle', 4: 'L1', 5: 'R1', 8: 'Share', 9: 'Options'
    },
    'Nintendo Switch': {
      0: 'B', 1: 'A', 2: 'X', 3: 'Y', 4: 'L', 5: 'R', 8: '-', 9: '+'
    }
  };

  const buttonIndex = mapping.buttons[action];
  return names[mapping.name]?.[buttonIndex] || `Button ${buttonIndex}`;
}

/**
 * Check if axis is past deadzone
 */
export function isAxisActive(value: number, deadzone: number = 0.15): boolean {
  return Math.abs(value) > deadzone;
}

/**
 * Get normalized axis direction (-1, 0, or 1)
 */
export function getAxisDirection(value: number, deadzone: number = 0.15): -1 | 0 | 1 {
  if (value > deadzone) return 1;
  if (value < -deadzone) return -1;
  return 0;
}

/**
 * Gamepad button state tracker
 */
export class GamepadButtonTracker {
  private previousState: boolean[] = [];

  /**
   * Update and check for newly pressed buttons
   */
  update(buttons: readonly GamepadButton[]): number[] {
    const newlyPressed: number[] = [];

    buttons.forEach((button, index) => {
      const wasPressed = this.previousState[index] || false;
      const isPressed = button.pressed;

      if (isPressed && !wasPressed) {
        newlyPressed.push(index);
      }

      this.previousState[index] = isPressed;
    });

    return newlyPressed;
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.previousState = [];
  }
}

/**
 * Vibrate gamepad if supported
 */
export function vibrateGamepad(
  gamepad: Gamepad,
  intensity: number = 0.5,
  duration: number = 100
): void {
  try {
    if ('vibrationActuator' in gamepad && gamepad.vibrationActuator) {
      (gamepad.vibrationActuator as any).playEffect('dual-rumble', {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5
      });
    }
  } catch (e) {
    // Vibration not supported
  }
}

/**
 * Vibration patterns
 */
export const VIBRATION_PATTERNS = {
  diceRoll: { intensity: 0.7, duration: 200 },
  victory: { intensity: 1.0, duration: 500 },
  defeat: { intensity: 0.3, duration: 300 },
  bonus: { intensity: 0.5, duration: 100 },
  trap: { intensity: 0.8, duration: 150 },
  notification: { intensity: 0.3, duration: 50 }
};
