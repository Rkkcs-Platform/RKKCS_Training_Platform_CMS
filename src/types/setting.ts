export interface ChallengeGenerationSettings {
  codeCount: number;
  codeLength: number;
  isAutoRandomCodeCount: boolean;
  generateTime?: string;
}


export interface UpdateChallengeSetting {
    codeCount: number;
    codeLength: number;
    isAutoRandomCodeCount: boolean;
    generateTime: string;
}

export const defaultSetting: ChallengeGenerationSettings = {
    codeCount: 20,
    codeLength: 10,
    isAutoRandomCodeCount: false,
} as ChallengeGenerationSettings;