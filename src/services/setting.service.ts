import { ChallengeGenerationSettings, UpdateChallengeSetting } from "@/types/setting";
import { api } from "./api";

export async function getSettingChallenge() {
    const { data } = await api.get<ChallengeGenerationSettings>('/setting/default');
    return data;
}

export async function updateSettingChallenge(setting: UpdateChallengeSetting) {
    const { data } = await api.post<ChallengeGenerationSettings>('/setting/update', setting);
    return data;
}