import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { LoaderBase } from '../loader/LoaderBase';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { StringUtil } from '../util/StringUtil';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';

/**
 * bitmap texture
 * @group Texture
 */
export class BitmapTexture2D extends Texture {
    private _source: HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement;
    public premultiplyAlpha: PremultiplyAlpha = 'none';
    private static _bitmapCache = new Map<string, ImageBitmap>();

    /**
     * @constructor
     * @param useMipmap Set whether to use mipmap
     */
    constructor(useMipmap: boolean = true) {
        super();
        this.useMipmap = useMipmap;

        this.lodMinClamp = 0;
        this.lodMaxClamp = 4;

        // this.visibility = GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    }

    /**
     * get raw data of this texture
     */
    public get source(): HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement {
        return this._source;
    }

    /**
     * set raw data of this texture
     */
    public set source(value: HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement) {
        this._source = value;

        if (this._source instanceof HTMLImageElement) {
            this._source.decode().then(async () => {
                if (this._source instanceof HTMLImageElement) {
                    const imageBitmap = await createImageBitmap(this._source, { imageOrientation: this.flipY ? "flipY" : "from-image", premultiplyAlpha: 'none' });
                    this.generate(imageBitmap);
                }
            });
        } else {
            //@bug not generate OffscreenCanvas
            if (this._source instanceof HTMLCanvasElement || this._source instanceof ImageBitmap) {
                this.generate(this._source);
            }
        }
    }

    /**
     * load texture data from web url
     * @param url web url
     * @param loaderFunctions callback function when load complete
     */
    public async load(url: string, loaderFunctions?: LoaderFunctions, allowCache: boolean = false) {
        this.name = StringUtil.getURLName(url);
        const cacheKey = `${url}|flipY=${this.flipY ? 1 : 0}`;
        
        if(allowCache) {
            const cached = BitmapTexture2D._bitmapCache.get(cacheKey);
            if (cached) {
                console.log(`BitmapTexture2D load from cache ${url}`);
                this.format = GPUTextureFormat.rgba8unorm;
                this.generate(cached);
                return true;
            }
        }

        console.log(`BitmapTexture2D load ${url}`);
        let imageBitmap: ImageBitmap;

        if (url.indexOf(";base64") !== -1) {
            const img = document.createElement("img");
            const start = url.indexOf("data:image");
            const uri = start >= 0 ? url.substring(start) : url;

            img.src = uri;
            await img.decode();

            img.width = Math.max(img.width, 32);
            img.height = Math.max(img.height, 32);

            imageBitmap = await createImageBitmap(img, {
                resizeWidth: img.width,
                resizeHeight: img.height,
                imageOrientation: this.flipY ? "flipY" : "from-image",
                premultiplyAlpha: "none",
            });
        } else {
            const r = await fetch(url, {
                headers: Object.assign(
                    { Accept: "image/avif,image/webp,*/*" },
                    loaderFunctions?.headers
                ),
            });

            const chunks = await LoaderBase.read(url, r, loaderFunctions);

            // Prefer real content-type if available
            const contentType = r.headers.get("content-type") ?? "application/octet-stream";
            const blob = new Blob([chunks], { type: contentType });

            imageBitmap = await createImageBitmap(blob, {
                imageOrientation: this.flipY ? "flipY" : "from-image",
                premultiplyAlpha: "none",
            });
        }

        if(allowCache) {
            BitmapTexture2D._bitmapCache.set(cacheKey, imageBitmap);
        }

        this.format = GPUTextureFormat.rgba8unorm;
        this.generate(imageBitmap);
        return true;
    }


    private imageData: Blob;
    /**
    * load data from Blob
    * @param imgData blob data which contains image
    */
    public async loadFromBlob(imgData: Blob) {
        this.imageData = imgData;
        let imageBitmap = await createImageBitmap(imgData, { imageOrientation: this.flipY ? 'flipY' : 'from-image', premultiplyAlpha: 'none' });
        if (imageBitmap.width < 32 || imageBitmap.height < 32) {
            let width = Math.max(imageBitmap.width, 32);
            let height = Math.max(imageBitmap.height, 32);
            imageBitmap = await createImageBitmap(imageBitmap, {
                resizeWidth: width,
                resizeHeight: height,
                imageOrientation: this.flipY ? "flipY" : "from-image",
                premultiplyAlpha: 'none'
            });
        }
        this.format = GPUTextureFormat.rgba8unorm;
        this.generate(imageBitmap);
        return true;
    }

}
