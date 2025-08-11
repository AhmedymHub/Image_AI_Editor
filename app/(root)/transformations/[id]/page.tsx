// app/(root)/transformations/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { transformationTypes, TransformationTypeKey } from "@/constants";
import { getUserById } from "@/lib/actions/user.actions";
import { getImageById } from "@/lib/actions/image.actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ match Next's Promise type

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  const image = await getImageById(id);

  const transformationType = image.transformationType as TransformationTypeKey;
  const transformation = transformationTypes[transformationType];
  if (!transformation) redirect("/not-found");

  return (
    <>
      <Header title={transformation.title} subtitle={transformation.subtitle} />
      <section className="mt-10">
        <TransformationForm
          action="Update"
          userId={user._id}
          type={transformationType}
          creditBalance={user.creditBalance}
          config={image.config}
          data={image}
        />
      </section>
    </>
  );
}
