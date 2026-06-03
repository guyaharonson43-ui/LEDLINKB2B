export const STRIP_IP_OPTIONS      = ['הכל', 'IP20', 'IP65', 'IP67', 'IP68'];
export const STRIP_TYPE_OPTIONS    = ['הכל', 'סטנדרט', 'COB', 'נאון', 'זיגזג', 'דיגיטלי'];
export const STRIP_COLOR_OPTIONS   = ['הכל', 'לבן', 'RGB', 'RGBW'];
export const STRIP_VOLTAGE_OPTIONS = ['הכל', '12V', '24V', '48V'];
export const STRIP_POWER_RANGES    = [
  { label: 'הכל',   min: 0,  max: 99999 },
  { label: 'עד 10W', min: 0,  max: 10    },
  { label: '10–15W', min: 10, max: 15    },
  { label: '15–20W', min: 15, max: 20    },
  { label: '20W+',   min: 20, max: 99999 },
];
export const STRIP_LMW_RANGES = [
  { label: 'הכל',    min: 0,   max: 99999 },
  { label: 'עד 100', min: 0,   max: 100   },
  { label: '100–150', min: 100, max: 150   },
  { label: '150–200', min: 150, max: 200   },
  { label: '200+',   min: 200, max: 99999 },
];

export const PS_VOLTAGE_OPTIONS       = ['הכל', '12V', '24V', '48V'];
export const PS_INPUT_VOLTAGE_OPTIONS = ['הכל', '12V', '24V', '48V', '110V', '230V'];
export const PS_IP_OPTIONS            = ['הכל', 'IP20', 'IP65', 'IP67', 'IP68'];
export const PS_OUTPUT_OPTIONS        = ['הכל', 'CV', 'CC', 'DALI', 'DMX'];
export const PS_DIMMING_OPTIONS       = ['הכל', 'DALI', '0-10V', 'PWM', 'TRIAC', 'Resistor', 'Push'];
export const PS_POWER_RANGES = [
  { label: 'הכל',     min: 0,   max: 99999 },
  { label: 'עד 30W',  min: 0,   max: 30    },
  { label: '30–60W',  min: 30,  max: 60    },
  { label: '60–100W', min: 60,  max: 100   },
  { label: '100–200W', min: 100, max: 200  },
  { label: '200W+',   min: 200, max: 99999 },
];

export const STRIP_CRI_OPTIONS = ['הכל', '>80', '>90', '>94', '>95'];

export const INIT_STRIP = { ip: 'הכל', type: 'הכל', color: 'הכל', voltage: 'הכל', cri: 'הכל', power: 'הכל', lmw: 'הכל' };
export const INIT_PS    = { smartType: 'הכל', voltage: 'הכל', inputVoltage: 'הכל', ip: 'הכל', output: 'הכל', dimming: 'הכל', power: 'הכל' };
