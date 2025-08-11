"use client";

import { useToast } from "@/hooks/use-toast";
import { dataUrl, getImageSize } from "@/lib/utils";
import {
  CldImage,
  CldUploadWidget,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import type { IImage } from "@/types";

type MediaUploaderProps = {
  onValueChange: (value: string) => void;
  setImage: React.Dispatch<React.SetStateAction<IImage>>;
  publicId: string;
  image: IImage;
  type: string;
};

const MediaUploader = ({
  onValueChange,
  setImage,
  image,
  publicId,
  type,
}: MediaUploaderProps) => {
  const { toast } = useToast();

  const onUploadSuccessHandler = (result: CloudinaryUploadWidgetResults) => {
    const { info } = result;

    // Ensure info is defined and matches the expected shape
    if (info && typeof info !== "string") {
      setImage({
        publicId: info.public_id,
        width: info.width,
        height: info.height,
        secureURL: info.secure_url,
      });

      // Call onValueChange with the new public ID
      onValueChange(info.public_id);

      // Show success toast
      toast({
        title: "Image uploaded successfully",
        description: "1 credit was deducted from your account",
        duration: 5000,
        className: "success-toast",
      });
    } else {
      // Handle cases where info is undefined or not in the expected format
      toast({
        title: "Image upload failed",
        description: "There was an issue with the uploaded image.",
        duration: 5000,
        className: "error-toast",
      });
    }
  };

  const onUploadErrorHandler = () => {
    // Show error toast
    toast({
      title: "Something went wrong while uploading",
      description: "Please try again",
      duration: 5000,
      className: "error-toast",
    });
  };

  return (
    <CldUploadWidget
      uploadPreset="imageAI_infinity"
      options={{
        multiple: false,
        resourceType: "image",
      }}
      onSuccess={onUploadSuccessHandler}
      onError={onUploadErrorHandler}
    >
      {({ open }) => (
        <div className="flex flex-col gap-4">
          <h3 className="h3-bold text-dark-600">Original</h3>

          {publicId ? (
            <>
              <div className="cursor-pointer overflow-hidden rounded-[10px]">
                <CldImage
                  width={getImageSize(type, image, "width")}
                  height={getImageSize(type, image, "height")}
                  src={publicId}
                  alt="image"
                  sizes={"(max-width: 767px) 100vw, 50vw"}
                  placeholder={dataUrl as PlaceholderValue}
                  className="media-uploader_cldImage"
                />
              </div>
            </>
          ) : (
            <div className="media-uploader_cta" onClick={() => open()}>
              <div className="media-uploader_cta-image">
                <Image
                  src="/assets/icons/add.svg"
                  alt="Add Image"
                  width={24}
                  height={24}
                />
              </div>
              <p className="p-14-medium">Click here to upload image</p>
            </div>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
};

export default MediaUploader;
