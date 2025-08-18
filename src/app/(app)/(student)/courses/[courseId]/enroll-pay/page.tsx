"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { UploadCloud, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { api } from "~/trpc/react";
import ConfirmationToast from "~/_components/ui/ConfirmationToast";
import { ImageUpload } from "~/_components/ui/ImageUpload";

const ProofUploadForm = ({
  courseId,
  onProofSubmitted,
}: {
  courseId: number;
  onProofSubmitted: () => void;
}) => {
  const [proofImageUrl, setProofImageUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmPaymentMutation =
    api.student.payment.confirmManualPayment.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate proof input first
      if (!proofImageUrl) {
        setError("Please upload a payment proof image.");
        setIsSubmitting(false);
        return;
      }

      // Create enrollment and payment records with proof in one transaction
      await confirmPaymentMutation.mutateAsync({
        courseId,
        proofImageUrl: proofImageUrl,
      });

      onProofSubmitted();
    } catch (error: any) {
      setError(error.message || "Failed to submit proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Payment Proof (Screenshot)
        </label>
        <ImageUpload
          uploadType="payment-proof"
          currentImageUrl={proofImageUrl || undefined}
          onImageUploaded={(imageUrl) => setProofImageUrl(imageUrl)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Proof"}
      </button>
    </form>
  );
};

const StatusDisplay = ({
  status,
  message,
}: {
  status: "info" | "success" | "warning";
  message: string;
}) => {
  const icons = {
    info: <Clock className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  };
  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  } as const;

  return (
    <div
      className={`flex items-center rounded-lg border p-4 ${colors[status]}`}
    >
      <div className="flex-shrink-0">{icons[status]}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
    </div>
  );
};

export default function EnrollAndPayPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId, 10);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch basic course information without creating payment records
  const { data: courseInfo, isLoading: courseLoading } =
    api.student.course.getCourseInfo.useQuery(
      { courseId },
      { enabled: !isNaN(courseId) },
    );

  useEffect(() => {
    if (courseInfo) {
      setCourseTitle(courseInfo.title);
      setCoursePrice(courseInfo.price);
    }
  }, [courseInfo]);

  const handleProofSubmitted = () => {
    setIsSubmitted(true);
    setShowSuccessToast(true);

    // Redirect to course page after successful submission
    setTimeout(() => {
      router.push(`/courses/${courseId}`);
    }, 2000);
  };

  if (courseLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <BreadcrumbsWithAnimation
          parentPaths={[{ name: "Courses", path: "/courses" }]}
          currentPath="Enrollment & Payment"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading course information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!courseInfo) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <BreadcrumbsWithAnimation
          parentPaths={[{ name: "Courses", path: "/courses" }]}
          currentPath="Error"
        />
        <div className="mt-4 rounded-lg bg-red-50 p-6 text-center text-red-800">
          <h2 className="mb-2 text-xl font-bold">Course not found</h2>
          <p>The course you're trying to enroll in could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <ConfirmationToast
          message="Proof submitted successfully! Redirecting to course..."
          isVisible={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />
        <BreadcrumbsWithAnimation
          parentPaths={[{ name: "Courses", path: `/courses/${courseId}` }]}
          currentPath="Enrollment Complete"
        />
        <div className="mt-8 rounded-lg bg-green-50 p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-3xl font-bold text-green-800">
            Enrollment Submitted!
          </h1>
          <p className="mb-4 text-green-700">
            Your payment proof has been submitted successfully. Our admin team
            will review it shortly.
          </p>
          <p className="text-sm text-green-600">
            You will be redirected to the course page automatically...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ConfirmationToast
        message="Proof submitted successfully!"
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Courses", path: `/courses/${courseId}` }]}
        currentPath="Enrollment & Payment"
      />
      <h1 className="mb-2 text-3xl font-bold">Complete Your Enrollment</h1>
      <p className="mb-6 text-gray-600">
        You are enrolling in:{" "}
        <span className="font-semibold">{courseTitle}</span>
      </p>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <AlertCircle className="mt-1 mr-3 h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Important: How the enrollment process works
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-blue-700">
              <li>First, make your payment using one of the methods below</li>
              <li>Take a screenshot of your payment confirmation</li>
              <li>Upload the screenshot using the form below</li>
              <li>
                Your enrollment will be processed only after you submit the
                proof
              </li>
              <li>Our admin team will review and approve your payment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-xl font-semibold">Step 1: Make Payment</h2>
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-lg font-medium">
                Total Amount:{" "}
                <span className="text-indigo-600">
                  ${coursePrice.toFixed(2)}
                </span>
              </p>
              <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-100 p-3">
                <p className="text-sm font-semibold text-yellow-800">
                  Payment Reference Format:
                </p>
                <p className="mt-1 rounded bg-white p-2 text-center font-mono text-lg tracking-wider">
                  {courseTitle.slice(0, 10).toUpperCase()}-{courseId}
                </p>
                <p className="mt-2 text-xs text-yellow-700">
                  **IMPORTANT**: Please include this reference in the
                  notes/description field of your payment. This helps us
                  identify your payment.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Payment Methods</h3>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="mb-2 font-medium">Scan QR Code</p>
                <Image
                  src="/placeholder-qr.png"
                  alt="Payment QR Code"
                  width={150}
                  height={150}
                  className="mx-auto rounded-md border bg-white p-1"
                />
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-2 font-medium">Or, Bank Transfer To:</p>
                <p>
                  <strong>Bank:</strong> Global Bank Inc.
                </p>
                <p>
                  <strong>Account Name:</strong> Let's Talk Edu
                </p>
                <p>
                  <strong>Account Number:</strong> 1234567890
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-2 font-medium">Or, E-Wallet Transfer To:</p>
                <p>
                  <strong>Service:</strong> PayApp
                </p>
                <p>
                  <strong>Number:</strong> 0987654321
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Step 2: Submit Proof</h2>
          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <StatusDisplay
              status="info"
              message="Please complete your payment first, then submit your payment proof below."
            />
            <ProofUploadForm
              courseId={courseId}
              onProofSubmitted={handleProofSubmitted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


