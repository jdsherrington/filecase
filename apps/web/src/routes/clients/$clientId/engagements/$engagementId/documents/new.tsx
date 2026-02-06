import { Button, Input, buttonVariants } from "@filecase/ui";
import { useMutation } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";

import { getCurrentUserServerFn } from "../../../../../../server/auth/server-fns";
import { uploadInitialDocumentServerFn } from "../../../../../../server/document-fns";

export const Route = createFileRoute(
  "/clients/$clientId/engagements/$engagementId/documents/new",
)({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: NewDocumentPage,
});

function NewDocumentPage() {
  const { clientId, engagementId } = Route.useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Please choose a file.");
      }

      const formData = new FormData();
      formData.set("title", title);
      formData.set("document_type", documentType);
      formData.set("client_id", clientId);
      formData.set("engagement_id", engagementId);
      formData.set("file", file);

      return uploadInitialDocumentServerFn({ data: formData });
    },
    onSuccess: async () => {
      await navigate({
        to: "/clients/$clientId/engagements/$engagementId/documents",
        params: { clientId, engagementId },
      });
    },
    onError: (uploadError) => {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Upload Document</h1>
        <Link
          className={buttonVariants({ variant: "outline" })}
          params={{ clientId, engagementId }}
          to="/clients/$clientId/engagements/$engagementId/documents"
        >
          Back
        </Link>
      </header>

      <form
        className="space-y-4 rounded-lg border p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          uploadMutation.mutate();
        }}
      >
        <label className="block text-sm font-medium" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label className="block text-sm font-medium" htmlFor="document-type">
          Document Type
        </label>
        <Input
          id="document-type"
          required
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
        />

        <label className="block text-sm font-medium" htmlFor="file">
          File
        </label>
        <Input
          id="file"
          required
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button disabled={uploadMutation.isPending} type="submit">
          {uploadMutation.isPending ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </main>
  );
}
