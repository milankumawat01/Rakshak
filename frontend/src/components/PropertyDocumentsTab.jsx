import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { uploadVaultDocument, deleteVaultDocument } from "../lib/api";
import { useT } from "../lib/i18n";

const CATEGORIES = [
  { key: "registration", labelKey: "vault.doc_registration" },
  { key: "stamp", labelKey: "vault.doc_stamp" },
  { key: "mutation", labelKey: "vault.doc_mutation" },
  { key: "khatiyan", labelKey: "vault.doc_khatiyan" },
  { key: "map", labelKey: "vault.doc_map" },
  { key: "other", labelKey: "vault.doc_other" },
];

const FALLBACK_LABELS = {
  "vault.doc_registration": "Registration Paper (Sale Deed)",
  "vault.doc_stamp": "Stamp Paper",
  "vault.doc_mutation": "Mutation Paper",
  "vault.doc_khatiyan": "Khatiyan / Land Record",
  "vault.doc_map": "Map / Layout Plan",
  "vault.doc_other": "Other Documents",
};

export default function PropertyDocumentsTab({ vault }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const docs = vault.documents || [];

  const docsByCategory = {};
  for (const d of docs) {
    docsByCategory[d.category] = docsByCategory[d.category] || [];
    docsByCategory[d.category].push(d);
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map(({ key, labelKey }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <CategorySection
            category={key}
            label={t(labelKey) || FALLBACK_LABELS[labelKey]}
            documents={docsByCategory[key] || []}
            vaultId={vault.vault_id}
            queryClient={queryClient}
            t={t}
          />
        </motion.div>
      ))}
    </div>
  );
}

function CategorySection({ category, label, documents, vaultId, queryClient, t }) {
  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      return uploadVaultDocument(vaultId, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vault", vaultId]);
      toast.success(t("vault.doc_uploaded") || "Document uploaded");
    },
    onError: () => toast.error(t("vault.upload_doc_failed") || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => deleteVaultDocument(vaultId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries(["vault", vaultId]);
      toast.success(t("vault.doc_deleted") || "Document deleted");
    },
    onError: () => toast.error(t("vault.delete_failed") || "Delete failed"),
  });

  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) uploadMutation.mutate(accepted[0]);
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div
      className="bg-bg-card rounded-2xl p-5 border border-border"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-text-primary">{label}</h4>
        <div
          {...getRootProps()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold rounded-lg text-xs font-medium cursor-pointer hover:bg-gold/20 active:scale-95 transition-all"
        >
          <input {...getInputProps()} />
          <Upload className="w-3.5 h-3.5" />
          {uploadMutation.isPending ? (t("common.uploading") || "Uploading...") : (t("vault.upload") || "Upload")}
        </div>
      </div>

      {documents.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 min-h-[120px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragActive ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="w-8 h-8 text-text-muted/30 mb-2" />
          <p className="text-sm text-text-muted">{t("vault.no_document") || "No document uploaded — Tap to add"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.doc_id}
              className="flex items-center justify-between bg-bg-input rounded-xl px-4 py-3 hover:bg-bg-input/70 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-text-muted shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium text-text-primary truncate">{doc.file_name}</p>
                  <p className="text-xs text-text-muted">
                    {doc.file_size_mb ? `${doc.file_size_mb} MB` : ""}{" "}
                    {doc.uploaded_at
                      ? `• ${new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-text-muted hover:text-gold transition-colors"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <a
                  href={doc.file_url}
                  download
                  className="p-1.5 text-text-muted hover:text-gold transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    if (confirm(t("vault.delete_doc_confirm") || "Delete this document?")) deleteMutation.mutate(doc.doc_id);
                  }}
                  className="p-1.5 text-text-muted hover:text-risk-red transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
