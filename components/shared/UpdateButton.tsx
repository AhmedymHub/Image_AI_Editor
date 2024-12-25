'use client'; // Mark this component as a client component

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from "next/link";

interface UpdateButtonProps {
  imageId: string;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ imageId }) => {
  const router = useRouter(); // Using useRouter hook here

  const handleNavigate = () => {
    router.push(`/transformations/${imageId}/update`); // Navigate to the update page
  };

  return (
    <Button onClick={handleNavigate} className="submit-button capitalize">
      Update Image
    </Button>
  );
};

export default UpdateButton;
