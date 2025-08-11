"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UpdateButtonProps {
  imageId: string;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ imageId }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/transformations/${imageId}/update`);
  };

  return (
    <Button onClick={handleNavigate} className="update-button capitalize">
      Update Image
    </Button>
  );
};

export default UpdateButton;
