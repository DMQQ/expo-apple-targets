"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniversalIconAsync = exports.withIosIcon = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const AssetContents_1 = require("@expo/prebuild-config/build/plugins/icons/AssetContents");
const fs = __importStar(require("fs"));
const path_1 = __importStar(require("path"));
const withIosIcon = (config, { cwd, type, icon, isTransparent = false }) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const namedProjectRoot = (0, path_1.join)(projectRoot, cwd);
            // Check if this is a liquid glass .icon folder
            const iconPath = typeof icon === "string" ? icon : icon.light;
            if (iconPath && path_1.default.extname(iconPath) === ".icon") {
                await addLiquidGlassIcon(iconPath, projectRoot, namedProjectRoot);
                return config;
            }
            // Ensure the Assets.xcassets/AppIcon.appiconset path exists
            await fs.promises.mkdir((0, path_1.join)(namedProjectRoot, IMAGESET_PATH), {
                recursive: true,
            });
            const imagesJson = [];
            const platform = type === "watch" ? "watchos" : "ios";
            // Get the base icon path
            const baseIconPath = typeof icon === "object"
                ? icon.light || icon.dark || icon.tinted
                : icon;
            if (baseIconPath) {
                // Generate the base/light icon
                const baseIcon = await generateUniversalIconAsync(projectRoot, {
                    icon: baseIconPath,
                    cacheKey: cwd + "-universal-icon",
                    iosNamedProjectRoot: namedProjectRoot,
                    platform,
                    isTransparent,
                });
                imagesJson.push(baseIcon);
            }
            // Handle dark and tinted variants (only for object icon config)
            if (typeof icon === "object") {
                if (icon.dark) {
                    const darkIcon = await generateUniversalIconAsync(projectRoot, {
                        icon: icon.dark,
                        cacheKey: cwd + "-universal-icon-dark",
                        iosNamedProjectRoot: namedProjectRoot,
                        platform,
                        appearance: "dark",
                        // Dark icons should preserve transparency
                        isTransparent: true,
                    });
                    imagesJson.push(darkIcon);
                }
                if (icon.tinted) {
                    const tintedIcon = await generateUniversalIconAsync(projectRoot, {
                        icon: icon.tinted,
                        cacheKey: cwd + "-universal-icon-tinted",
                        iosNamedProjectRoot: namedProjectRoot,
                        platform,
                        appearance: "tinted",
                        isTransparent,
                    });
                    imagesJson.push(tintedIcon);
                }
            }
            // Write the Contents.json
            await (0, AssetContents_1.writeContentsJsonAsync)((0, path_1.join)(namedProjectRoot, IMAGESET_PATH), {
                images: imagesJson,
            });
            return config;
        },
    ]);
};
exports.withIosIcon = withIosIcon;
const IMAGE_CACHE_NAME = "widget-icons-";
const IMAGESET_PATH = "Assets.xcassets/AppIcon.appiconset";
function getAppleIconName(size, scale, appearance) {
    let name = "App-Icon";
    if (appearance) {
        name = `${name}-${appearance}`;
    }
    name = `${name}-${size}x${size}@${scale}x.png`;
    return name;
}
async function generateUniversalIconAsync(projectRoot, { icon, cacheKey, iosNamedProjectRoot, platform, appearance, isTransparent = false, }) {
    const size = 1024;
    const filename = getAppleIconName(size, 1, appearance);
    // Using this method will cache the images in `.expo` based on the properties used to generate them.
    // This method also supports remote URLs and using the global sharp instance.
    const { source } = await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: IMAGE_CACHE_NAME + cacheKey }, {
        src: icon,
        name: filename,
        width: size,
        height: size,
        // Transparency needs to be preserved in dark variant, but can safely be removed in "light" and "tinted" variants.
        removeTransparency: !isTransparent && appearance !== "dark",
        // The icon should be square, but if it's not then it will be cropped.
        resizeMode: "cover",
        // Force the background color to solid white to prevent any transparency (for "any" and "tinted" variants).
        // Dark variants should not have a background color to preserve transparency.
        backgroundColor: appearance === "dark"
            ? undefined
            : isTransparent
                ? "#ffffff00"
                : "#ffffff",
    });
    // Write image buffer to the file system.
    const assetPath = (0, path_1.join)(iosNamedProjectRoot, IMAGESET_PATH, filename);
    await fs.promises.writeFile(assetPath, source);
    return {
        filename,
        idiom: "universal",
        platform,
        size: `${size}x${size}`,
        ...(appearance
            ? { appearances: [{ appearance: "luminosity", value: appearance }] }
            : {}),
    };
}
exports.generateUniversalIconAsync = generateUniversalIconAsync;
async function addLiquidGlassIcon(iconPath, projectRoot, iosNamedProjectRoot) {
    const iconName = path_1.default.basename(iconPath, ".icon");
    const sourceIconPath = path_1.default.join(projectRoot, iconPath);
    const targetIconPath = path_1.default.join(iosNamedProjectRoot, `${iconName}.icon`);
    if (!fs.existsSync(sourceIconPath)) {
        console.warn(`[withIosIcon] Liquid glass icon file not found at path: ${iconPath}`);
        return;
    }
    await fs.promises.cp(sourceIconPath, targetIconPath, { recursive: true });
}
