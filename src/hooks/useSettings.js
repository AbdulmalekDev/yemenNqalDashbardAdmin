import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSettings,
    getPublicSettings,
    updateSettings as updateSettingsAPI,
} from "../services/settingsService";

// ==================== جلب الإعدادات ====================
export const useSettings = (publicOnly = false) => {
    return useQuery({
        queryKey: ["settings", publicOnly ? "public" : "full"],
        queryFn: async () => {
            const result = publicOnly ? await getPublicSettings() : await getSettings();
            return result.data; // unwrap { success, data, message } → data
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: !publicOnly,
    });
};

// ==================== تحديث الإعدادات (مع Optimistic Update) ====================
export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settingsData) => updateSettingsAPI(settingsData),

        // Optimistic Update
        onMutate: async (newSettings) => {
            await queryClient.cancelQueries({ queryKey: ["settings"] });

            const previousSettings = queryClient.getQueryData(["settings"]);

            queryClient.setQueryData(["settings"], (old) => {
                if (!old) return old;
                // دمج الإعدادات الجديدة مع القديمة
                return deepMerge(old, newSettings);
            });

            return { previousSettings };
        },

        onError: (_err, _newSettings, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(["settings"], context.previousSettings);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });
};

// دالة مساعدة لدمج الكائنات بعمق
function deepMerge(target, source) {
    const output = { ...target };
    for (const key of Object.keys(source)) {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === "object"
        ) {
            output[key] = deepMerge(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
}
