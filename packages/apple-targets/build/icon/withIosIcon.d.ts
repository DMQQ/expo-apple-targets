import { ConfigPlugin } from "@expo/config-plugins";
import { ContentsJsonImage } from "@expo/prebuild-config/build/plugins/icons/AssetContents";
import { ExtensionType } from "../target";
export type IconConfig = string | {
    light?: string;
    dark?: string;
    tinted?: string;
};
export declare const withIosIcon: ConfigPlugin<{
    cwd: string;
    type: ExtensionType;
    icon: IconConfig;
    isTransparent?: boolean;
}>;
export declare function generateUniversalIconAsync(projectRoot: string, { icon, cacheKey, iosNamedProjectRoot, platform, appearance, isTransparent, }: {
    platform: "watchos" | "ios";
    icon: string;
    appearance?: "dark" | "tinted";
    iosNamedProjectRoot: string;
    cacheKey: string;
    isTransparent?: boolean;
}): Promise<ContentsJsonImage>;
