import { RenderTexture } from "./RenderTexture";

export class ExternallyManagedRenderTexture extends RenderTexture {
    constructor(
        texture: GPUTexture,
        clear: boolean = false,
        sampleCount: number = 0,
    ) {
        const useMipMap = false;
        const numberLayer = 1;
        const autoResize = false;

        super(
            texture.width,
            texture.height,
            texture.format,
            useMipMap,
            texture.usage,
            numberLayer,
            sampleCount,
            clear,
            autoResize
        );

        this.updateTexture(texture);
    }

    /**
     * USE THIS instead of `resize`; since the texture is externally managed, it
     * is up to YOU to create a new texture with the correct size.
     */
    public updateTexture(texture: GPUTexture) {
        if (this.usage !== texture.usage) {
            throw new Error("Cannot update texture with different usage.");
        }

        if (this.format !== texture.format) {
            throw new Error("Cannot update texture with different format.");
        }

        this.width = texture.width;
        this.height = texture.height;
        this.gpuTexture = texture;
        this.view = texture.createView();
        this.createTextureDescriptor(this.width, this.height, this.mipmapCount, this.format, this.usage, this.numberLayer, this.sampleCount);
        this.noticeChange();
    }

    /**
     * We don't want to destroy and re-allocate the texture, so this is a no-op.
     */
    protected updateGPUTexture() {
        console.error('Tried ExternallyManagedRenderTexture.updateGPUTexture. This is not supported.');
    }

    /**
     * This shouldn't really be called outside the constructor; should generally
     * be a no-op since this class doesn't manage the texture.
     */
    public resize(width: number, height: number) {
        if (!this.gpuTexture) {
            super.resize(width, height);
        } else {
            throw new Error('Repeated resizing not supported for ExternallyManagedRenderTexture.');
        }
    }
}
