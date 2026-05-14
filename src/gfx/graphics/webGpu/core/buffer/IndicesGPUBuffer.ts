import { MemoryDO } from '../../../../../core/pool/memory/MemoryDO';
import { MemoryInfo } from '../../../../../core/pool/memory/MemoryInfo';
import { webGPUContext } from '../../Context3D';
import { ArrayBufferData } from './ArrayBufferData';
import { GPUBufferBase } from './GPUBufferBase';
import { GPUBufferType } from './GPUBufferType';

/**
 * The buffer use at geometry indices
 * written in the computer shader or CPU Coder
 * usage GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX | GPUBufferUsage.INDIRECT
 * @group GFX
 */
export class IndicesGPUBuffer extends GPUBufferBase {
    public indicesNode: MemoryInfo;
    constructor(data?: ArrayBufferData) {
        super();
        this.bufferType = GPUBufferType.IndicesGPUBuffer;
        this.createIndicesBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX | GPUBufferUsage.INDIRECT, data);
    }

    public webKitWorkaround_Reset() {
        let device = webGPUContext.device;
        const usage = this.buffer.usage;
        const size = this.buffer.size;
        
        if (this.buffer) {
            this.buffer.destroy();
            
        }
        if (this._readBuffer) {
            this._readBuffer.destroy();
        }
        
        this.buffer = device.createBuffer({
            label: "IndicesGPUBuffer",
            size: size,
            usage: usage,
            mappedAtCreation: false,
        });

        this.apply();
    }

    protected createIndicesBuffer(usage: GPUBufferUsageFlags, data?: ArrayBufferData) {
        let device = webGPUContext.device;
        this.byteSize = data.length * 4;
        this.usage = usage;
        if (this.buffer) {
            this.destroy();
        }
        this.buffer = device.createBuffer({
            label: "IndicesGPUBuffer",
            size: this.byteSize,
            usage: usage,
            mappedAtCreation: false,
        });

        this.memory = new MemoryDO();
        this.memoryNodes = new Map<string | number, MemoryInfo>();
        this.memory.allocation(this.byteSize);
        if (data) {
            this.indicesNode = this.memory.allocation_node(data.length * 4);
            this.indicesNode.setArrayBuffer(0, data);
            this.apply();
        }
    }
}
