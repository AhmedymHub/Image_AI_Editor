"use client";  // Add this line at the very top

import { dataUrl, debounce, download, getImageSize } from '@/lib/utils'
import { CldImage, getCldImageUrl } from 'next-cloudinary'
import { PlaceholderValue } from 'next/dist/shared/lib/get-img-props'
import Image from 'next/image'
import { useEffect } from 'react'

const TransformedImage = ({ image, type, title, transformationConfig, 
    isTransforming, setIsTransforming, hasDownload = true }: TransformedImageProps) => {
        const downloadHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          e.preventDefault();

          download(getCldImageUrl({
            width: image?.width,
            height: image?.height,
            src: image?.publicId,
            ...transformationConfig
          }), title)
        }

        useEffect(() => {
          // Optionally handle any side effects when the image or transformationConfig changes
        }, [image, transformationConfig])

  return (
    <div className="flex flex-col gap-4">
        <div className="flex-between">
            <h3 className="h3-bold text-dark-600">
                Transformed
            </h3>

            {hasDownload && (
                <button 
                className="download-btn" 
                onClick={downloadHandler}
                >
                    <Image 
                      src="/assets/icons/download.svg"
                      alt="Dowload"
                      width={24}
                      height={24}
                      className="pg-[6px]"
                    />
                </button>
             )}
        </div>
        {image?.publicId && transformationConfig ? (
            <div className="relative">
              <CldImage 
                  width={getImageSize(type, image, "width")}
                  height={getImageSize(type, image, "height")}
                  src={image?.publicId}
                  alt={image.title}
                  sizes={"(max-width: 767px) 100vw, 50vw"}
                  placeholder={dataUrl as PlaceholderValue}
                  className="transformed-image"
                  onLoad={() => {
                    if (setIsTransforming) {
                      setIsTransforming(false);
                    }
                  }}
                  onError={() => {
                    debounce(() => {
                        if (setIsTransforming) {
                          setIsTransforming(false);
                        }
                    }, 8000)()
                  }}
                  {...transformationConfig}
              />
              {isTransforming && (
                <div className="transforming-loader">
                    <Image 
                      src="/assets/icons/spinner.svg"
                      alt="spinner"
                      width={50}
                      height={50}
                    />
                    <p className="text-white/80">Please wait...</p>
                </div>
              )}
            </div>
        ) : (
            <div className="transformed-placeholder">
                Transformed Image
            </div>
        )}
    </div>
  )
}

export default TransformedImage;
