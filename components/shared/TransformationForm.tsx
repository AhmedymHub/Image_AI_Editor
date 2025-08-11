"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  aspectRatioOptions,
  creditFee,
  defaultValues,
  transformationTypes,
} from "@/constants";
import { CustomField } from "./CustomField";
import { useEffect, useState, useTransition } from "react";
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils";
import MediaUploader from "./MediaUploader";
import TransformedImage from "./TransformedImage";
import { updateCredits } from "@/lib/actions/user.actions";
import { getCldImageUrl } from "next-cloudinary";
import { addImage, updateImage } from "@/lib/actions/image.actions";
import { useRouter } from "next/navigation";
import { InsufficientCreditsModal } from "./InsuffiencientCreditsModal";
import UpdateButton from "@/components/shared/UpdateButton";

import type { IImage, TransformationTypeKey, Transformations } from "@/types";

// Your form schema stays the same
export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
});

interface TransformationFormProps {
  action: "Add" | "Update";
  data?: IImage | null;
  userId: string;
  type: TransformationTypeKey;
  creditBalance: number;
  config?: Transformations | null;
}

const TransformationForm = ({
  action,
  data = null,
  userId,
  type,
  creditBalance,
  config = null,
}: TransformationFormProps) => {
  const transformationType = transformationTypes[type];

  // Provide safe defaults for image state using IImage (nullable properties allowed)
  const initialImage: IImage = data ?? {
    _id: undefined,
    title: "",
    publicId: "",
    width: 0,
    height: 0,
    secureURL: "",
    aspectRatio: undefined,
    prompt: undefined,
    color: undefined,
  };

  const [image, setImage] = useState<IImage>(initialImage);
  const [newTransformation, setNewTransformation] =
    useState<Transformations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationConfig, setTransformationConfig] =
    useState<Transformations | null>(config);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const initialValues =
    data && action === "Update"
      ? {
          title: data.title || "",
          aspectRatio: data.aspectRatio,
          color: data.color,
          prompt: data.prompt,
          publicId: data.publicId,
        }
      : defaultValues;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // Ensure width and height are never null or undefined
    const fixedImage = {
      ...image,
      width: image?.width ?? 0,
      height: image?.height ?? 0,
      publicId: image?.publicId ?? "",
      secureURL: image?.secureURL ?? "",
    };

    if (!fixedImage.publicId || !fixedImage.secureURL || !values.title) {
      console.error("Missing required image fields");
      setIsSubmitting(false);
      return;
    }

    const transformationUrl = getCldImageUrl({
      width: fixedImage.width,
      height: fixedImage.height,
      src: fixedImage.publicId,
      ...transformationConfig,
    });

    const imageData = {
      title: values.title,
      publicId: fixedImage.publicId,
      transformationType: type,
      width: fixedImage.width,
      height: fixedImage.height,
      config: transformationConfig,
      secureURL: fixedImage.secureURL,
      transformationURL: transformationUrl,
      aspectRatio: values.aspectRatio,
      prompt: values.prompt,
      color: values.color,
    };

    try {
      if (action === "Add") {
        const newImage = await addImage({
          image: imageData,
          userId,
          path: "/",
        });

        if (newImage) {
          form.reset();
          // REMOVE setImage(initialImage);
          // Wait for navigation, let the next page handle loading fresh data
          router.push(`/transformations/${newImage._id}`);
        }
      } else if (action === "Update") {
        if (!data?._id) {
          console.error("No image _id found for update");
          setIsSubmitting(false);
          return;
        }

        const updatedImage = await updateImage({
          image: {
            ...imageData,
            _id: data._id,
          },
          userId,
          path: `/transformations/${data._id}`,
        });

        if (updatedImage) {
          router.push(`/transformations/${updatedImage._id}`);
        }
      }
    } catch (error) {
      console.error(error);
    }

    setIsSubmitting(false);
  }

  const onSelectFieldHandler = (
    value: string,
    onChangeField: (value: string) => void
  ) => {
    const imageSize = aspectRatioOptions[value as AspectRatioKey];

    setImage((prevState) => ({
      ...prevState,
      aspectRatio: imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
    }));

    setNewTransformation(transformationType.config);

    onChangeField(value);
  };

  const onInputChangeHandler = (
    fieldName: string,
    value: string,
    typeKey: TransformationTypeKey,
    onChangeField: (value: string) => void
  ) => {
    debounce(() => {
      setNewTransformation((prevState: Transformations | null) => {
        if (!prevState) return {};

        const mapKey = typeKey === "fill" ? "fillBackground" : typeKey;

        const currentValue = prevState[mapKey];

        if (typeof currentValue === "boolean" || !currentValue) {
          return {
            ...prevState,
            [typeKey]: {
              [fieldName === "prompt" ? "prompt" : "to"]: value,
            },
          };
        }

        return {
          ...prevState,
          [typeKey]: {
            ...currentValue,
            [fieldName === "prompt" ? "prompt" : "to"]: value,
          },
        };
      });
    }, 1000)();

    onChangeField(value);
  };

  const onTransformHandler = async () => {
    setIsTransforming(true);

    setTransformationConfig(
      deepMergeObjects(newTransformation, transformationConfig)
    );

    setNewTransformation(null);

    startTransition(async () => {
      await updateCredits(userId, creditFee);
    });
  };

  useEffect(() => {
    if (image && (type === "restore" || type === "removeBackground")) {
      setNewTransformation(transformationType.config);
    }
  }, [image, transformationType, type]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}
        <CustomField
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full pt-6"
          render={({ field }) => <input {...field} className="input-field" />}
        />

        {type === "fill" && (
          <CustomField
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({ field }) => (
              <Select
                onValueChange={(value) =>
                  onSelectFieldHandler(value, field.onChange)
                }
                value={field.value}
              >
                <SelectTrigger className="select-field">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(aspectRatioOptions).map((key) => (
                    <SelectItem key={key} value={key} className="select-item">
                      {aspectRatioOptions[key as AspectRatioKey].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {(type === "remove" || type === "recolor") && (
          <div className="prompt-field">
            <CustomField
              control={form.control}
              name="prompt"
              formLabel={
                type === "remove" ? "Object to remove" : "Object to recolor"
              }
              className="w-full"
              render={({ field }) => (
                <input
                  value={field.value}
                  className="input-field"
                  onChange={(e) =>
                    onInputChangeHandler(
                      "prompt",
                      e.target.value,
                      type,
                      field.onChange
                    )
                  }
                />
              )}
            />

            {type === "recolor" && (
              <CustomField
                control={form.control}
                name="color"
                formLabel="Replacement Color"
                className="w-full "
                render={({ field }) => (
                  <input
                    value={field.value}
                    className="input-field"
                    onChange={(e) =>
                      onInputChangeHandler(
                        "color",
                        e.target.value,
                        "recolor",
                        field.onChange
                      )
                    }
                  />
                )}
              />
            )}
          </div>
        )}

        <div className="media-uploader-field">
          <CustomField
            control={form.control}
            name="publicId"
            className="flex size-full flex-col"
            render={({ field }) => (
              <MediaUploader
                onValueChange={field.onChange}
                setImage={setImage}
                publicId={field.value}
                image={image}
                type={type}
              />
            )}
          />

          <TransformedImage
            image={image}
            type={type}
            title={form.getValues().title}
            isTransforming={isTransforming}
            setIsTransforming={setIsTransforming}
            transformationConfig={transformationConfig}
          />
        </div>

        <div className="flex flex-col gap-4">
          {/* Show "Apply Transformation" only if adding a new image */}
          {action === "Add" && (
            <Button
              type="button"
              className="submit-button capitalize"
              disabled={isTransforming || newTransformation === null}
              onClick={onTransformHandler}
            >
              {isTransforming ? "Transforming..." : "Apply Transformation"}
            </Button>
          )}

          {/* Always show "Save Image" */}
          <Button
            type="submit"
            className="submit-button capitalize"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Save Image"}
          </Button>

          {/* Show UpdateButton only if updating and image has an ID */}
          {action === "Update" && image._id && (
            <UpdateButton imageId={image._id} />
          )}
        </div>
      </form>
    </Form>
  );
};

export default TransformationForm;
