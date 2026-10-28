import { ChallengeGenerationSettings, UpdateChallengeSetting } from "@/types/setting";
import { api } from "./api";

export type MaintenanceStatus = {
  maintenance: boolean;
  language: string;
  until: string | null;
};

export async function getSettingChallenge() {
    const { data } = await api.get<ChallengeGenerationSettings>('/setting/default');
    return data;
}

export async function updateSettingChallenge(setting: UpdateChallengeSetting) {
    const { data } = await api.post<ChallengeGenerationSettings>('/setting/update', setting);
    return data;
}

export async function getMaintenanceStatus() {
    const { data } = await api.get<MaintenanceStatus>('/admin/settings/maintenance');
    return data;
}

export async function setMaintenanceMode(enabled: boolean, until?: string) {
    const { data } = await api.patch<MaintenanceStatus>('/admin/settings/maintenance', {
      enabled,
      ...(enabled && until ? { until } : {}),
    });
    return data;
}

export async function setLanguage(language: 'vi' | 'en' | 'ja') {
    const { data } = await api.patch<{ language: string }>('/admin/settings/language', { language });
    return data;
}
