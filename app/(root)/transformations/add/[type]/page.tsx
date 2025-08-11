import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { transformationTypes } from "@/constants";
import { getUserById } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type TransformationTypeKey = keyof typeof transformationTypes;

type Props = {
  params: Promise<{ type: string }>;
};

const AddTransformationTypePage = async ({ params }: Props) => {
  const { type } = await params; // ✅ await because it's a Promise

  const transformation = transformationTypes[type as TransformationTypeKey];
  if (!transformation) redirect("/not-found");

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <>
      <Header title={transformation.title} subtitle={transformation.subtitle} />
      <section className="mt-10">
        <TransformationForm
          action="Add"
          userId={user._id}
          type={type as TransformationTypeKey}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  );
};

export default AddTransformationTypePage;
