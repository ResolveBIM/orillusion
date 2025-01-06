import { Engine3D } from "../../../../Engine3D";
import { Camera3D } from "../../../../core/Camera3D";

import { RenderTexture } from "../../../../textures/RenderTexture";
import { devLogger } from "../../../../util/DevLogger";
import { getDepthClearValue } from "../../../graphics/webGpu/WebGPUConst";
import { Texture } from "../../../graphics/webGpu/core/texture/Texture";
import { RTDescriptor } from "../../../graphics/webGpu/descriptor/RTDescriptor";
import { RTFrame } from "../../frame/RTFrame";

/**
 * @internal
 */
export class RendererPassState {

    public label: string = "";
    public customSize: boolean = false;
    public zPreTexture: RenderTexture = null;
    public depthTexture: RenderTexture = null;
    public renderTargetTextures: GPUColorTargetState[];
    public outColor: number = -1;
    public renderTargets: Texture[];
    public rtTextureDescriptors: RTDescriptor[];
    public irradianceBuffer: Texture[];
    public multisample: number = 0;
    public multiTexture: GPUTexture;
    public depthViewIndex: number = 0;
    public depthCleanValue: number = getDepthClearValue('near');
    public isOutTarget: boolean = true;
    public camera3D: Camera3D;
    public rtFrame: RTFrame;
    public renderPassDescriptor: GPURenderPassDescriptor;
    public renderBundleEncoderDescriptor: GPURenderBundleEncoderDescriptor;
    public depthLoadOp: GPULoadOp;

    getLastRenderTexture() {
        devLogger.stackLog("getLastRenderTexture renderTarget[0]:", this.renderTargets[0]);
        if (this.renderTargets) {
            return this.renderTargets.length > 0 ? this.renderTargets[0] : Engine3D.res.redTexture;
        } else {
            return Engine3D.res.redTexture
        }
    }
}
