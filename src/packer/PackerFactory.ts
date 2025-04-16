import { Packer } from "./Packer";
import { AppSettings } from "../types";
import { LeftBottomPacker } from "./LeftBottomPacker";
import { MaxRectsPacker } from "./MaxRectsPacker";

// Define the constructor type that explicitly extends Packer
type PackerConstructor = new (settings: AppSettings) => Packer;

// Constants for packer type names
export const PackerTypes = {
    LEFT_BOTTOM: "LeftBottom",
    MAX_RECTS: "MaxRects"
} as const;

export class PackerFactory {
    // The registry of packer
    private static packerRegistry: Map<string, PackerConstructor> = new Map([
        [PackerTypes.LEFT_BOTTOM, LeftBottomPacker as PackerConstructor],
        [PackerTypes.MAX_RECTS, MaxRectsPacker as PackerConstructor],
        //other more packer
    ]);

    /**
     * Creates a Packer instance of specified type
     * @param type Name of the packer type
     * @param appSettings Application settings
     * @returns Packer instance
     * @throws Error if type doesn't exist
     */
    public static createPacker(type: string, appSettings: AppSettings): Packer {
        const PackerClass = this.packerRegistry.get(type);
        if (!PackerClass) {
            throw new Error(`Unknown packer type: ${type}. Available types: ${Array.from(this.packerRegistry.keys()).join(", ")}`);
        }
        return new PackerClass(appSettings);
    }

    /**
     * Registers a new packer type
     * @param type Name of the type
     * @param packerClass Packer class constructor
     * @throws Error if packerClass is not a valid Packer subclass
     */
    public static registerPacker(type: string, packerClass: PackerConstructor): void {
        // Basic class validation
        if (typeof packerClass !== 'function') {
            throw new Error(`Invalid packer class: must be a constructor function`);
        }

        if (this.packerRegistry.has(type)) {
            console.warn(`Overwriting existing packer type: ${type}`);
        }
        this.packerRegistry.set(type, packerClass);
    }

    /**
     * Gets all registered packer types
     * @returns Array of registered type names
     */
    public static getRegisteredPackers(): string[] {
        return Array.from(this.packerRegistry.keys());
    }

    /**
     * Checks if a packer type is registered
     * @param type Name of the type
     * @returns Whether the type is registered
     */
    public static hasPacker(type: string): boolean {
        return this.packerRegistry.has(type);
    }

    /**
     * Clears all registered packer types
     */
    public static clearRegistry(): void {
        this.packerRegistry.clear();
    }
}