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

export async function getMaintenanceStatus() {
    const { data } = await api.get<{ maintenance: boolean }>('/admin/settings/maintenance');
    return data;
}

export async function setMaintenanceMode(enabled: boolean) {
    const { data } = await api.patch<{ maintenance: boolean }>('/admin/settings/maintenance', { enabled });
    return data;
}