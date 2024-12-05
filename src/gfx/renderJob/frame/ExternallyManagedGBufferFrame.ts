import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { ExternallyManagedRenderTexture } from "../../../textures/ExternallyManagedRenderTexture";
import { RenderTexture } from "../../../textures/RenderTexture";
import { RTResourceConfig } from "../config/RTResourceConfig";
import { GBufferFrame } from './GBufferFrame';
import { RTResourceMap } from "./RTResourceMap";

/**
 * Externally managed version of:
 * @orillusion/core.GBufferFrame
 */
export class ExternallyManagedGBufferFrame extends GBufferFrame {
    /**
    * Externally managed version of:
    * @orillusion/core.GBufferFrame.createGBuffer
    * @orillusion/core.GBufferFrame.getGBufferFrame
    *
    * This will create a GBuffer using the provided `GPUTexture` and register it
    * with the `GBufferFrame` singleton cache. It is up to you to make sure the
    * parameters passed to this function match those used to create the
    * `GPUTexture`, and up to you to manage its lifecycle.
    *
    * @param {GPUTexture} colorTexture - The color texture to use for the GBuffer.
    */
    createExternallyManagedGBuffer(
        key: string,
        colorTexture: ExternallyManagedRenderTexture,
        depthTexture: ExternallyManagedRenderTexture,
    ): ExternallyManagedGBufferFrame {
        /*
        * SET COLOR TEXTURE
        */
        //=BEGIN GBufferFrame.createGBuffer
        let { renderTargets: attachments, rtDescriptors } = this;

        const colorDesc = new RTDescriptor();
        colorDesc.loadOp = colorTexture.clear ? 'clear' : 'load';

        //=BEGIN RTResourceMap.createRTTexture
        // NOTE: this seems to have internal significance
        colorTexture.name = key + RTResourceConfig.colorBufferTex_NAME;
        RTResourceMap.rtTextureMap.set(colorTexture.name, colorTexture);
        //=END RTResourceMap.createRTTexture

        // NOTE: must set private variable here
        // @ts-ignore
        this._colorBufferTex = colorTexture;

        attachments.push(colorTexture);
        rtDescriptors.push(colorDesc);
        //=END GBufferFrame.createGBuffer

        /*
        * SET COMPRESS G BUFFER TEXTURE
        *
        * Copied directly from GBufferFrame.createGBuffer
        */
        const compressTexture = new RenderTexture(
            colorTexture.width,
            colorTexture.height,
            GPUTextureFormat.rgba32float,
            //'bgra8unorm',
            false,
            undefined,
            1,
            colorTexture.sampleCount,
            colorTexture.clear,
            true,
        );
        // @ts-ignore
        this._compressGBufferTex = compressTexture;
        attachments.push(compressTexture);
        rtDescriptors.push(new RTDescriptor());

        /*
        * SET DEPTH TEXTURE
        */
        depthTexture.name = key + '_depthTexture';
        this.depthTexture = depthTexture;
        this._depthLoadOp = depthTexture.clear ? 'clear' : 'load';

        /*
        * STORE GBUFFER
        */
        GBufferFrame.gBufferMap.set(key, this);

        return this;
    }

    public get depthLoadOp() {
        return this._depthLoadOp;
    }

    public set depthLoadOp(_value: GPULoadOp) {
        // no-op; this should be externally cleared.
    }
}
