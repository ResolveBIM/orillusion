import { ColorPassRenderer } from "./ColorPassRenderer";

/**
 * Exposes the color and depth attachments to external renderers, allowing
 * them to run opaque and transparent passes on the same scene.
 * @author stefco
 */
export class CompositeColorPassRenderer extends ColorPassRenderer {
    /**
     * These external renderers run before the Orillusion color pass.
     * They should be opaque passes.
     */
    public preColorPass: (() => void)[];

    /**
     * These external renderers run after the Orillusion color pass.
     * They should be transparent passes.
     */
    public postColorPass: (() => void)[];

    constructor() {
        super();
        this.preColorPass = [];
        this.postColorPass = [];
    }

    public render(...args: Parameters<ColorPassRenderer['render']>) {
        this.preColorPass.forEach(renderer => renderer());
        super.render(...args);
        this.postColorPass.forEach(renderer => renderer());
    }
}
