"use client";

import type { ReactNode } from "react";

import { CodeEditor } from "@/components/ui/code-editor";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Textarea } from "@/components/ui/textarea";
import {
  CODE_TYPE_IDS,
  CONTENT_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
  URL_TYPE_IDS,
} from "@/lib/item-type-fields";

/** The editable field values shared by the create and edit item forms. */
export interface ItemFormValues {
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

type ItemFormField = keyof ItemFormValues;

interface ItemFormFieldsProps {
  /** Item type id, used to decide which fields to render. */
  typeId: string;
  values: ItemFormValues;
  onChange: (field: ItemFormField, value: string) => void;
  /** Id prefix so create/edit inputs get unique ids. */
  idPrefix: string;
  /** Disables every control while a form is submitting. */
  disabled?: boolean;
  /** Rendered between Description and Content (e.g. the upload field). */
  afterDescription?: ReactNode;
}

/**
 * The type-aware field set shared by the New Item dialog and the drawer's
 * inline edit form: Description, the per-type content editor (Monaco/Markdown/
 * textarea), Language, URL and Tags. The title and upload fields stay in their
 * respective callers.
 */
export function ItemFormFields({
  typeId,
  values,
  onChange,
  idPrefix,
  disabled = false,
  afterDescription,
}: ItemFormFieldsProps) {
  const showContent = CONTENT_TYPE_IDS.has(typeId);
  const showLanguage = LANGUAGE_TYPE_IDS.has(typeId);
  const showUrl = URL_TYPE_IDS.has(typeId);
  const usesCodeEditor = CODE_TYPE_IDS.has(typeId);
  const usesMarkdownEditor = MARKDOWN_TYPE_IDS.has(typeId);

  return (
    <>
      <FormField label="Description" htmlFor={`${idPrefix}-description`}>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Add a description"
          rows={3}
          disabled={disabled}
        />
      </FormField>

      {afterDescription}

      {showContent ? (
        usesCodeEditor ? (
          <FormField label="Content">
            <CodeEditor
              aria-label="Content"
              value={values.content}
              language={values.language}
              disabled={disabled}
              onChange={(next) => onChange("content", next)}
            />
          </FormField>
        ) : usesMarkdownEditor ? (
          <FormField label="Content">
            <MarkdownEditor
              aria-label="Content"
              value={values.content}
              disabled={disabled}
              onChange={(next) => onChange("content", next)}
            />
          </FormField>
        ) : (
          <FormField label="Content" htmlFor={`${idPrefix}-content`}>
            <Textarea
              id={`${idPrefix}-content`}
              value={values.content}
              onChange={(event) => onChange("content", event.target.value)}
              placeholder="Add content"
              rows={8}
              disabled={disabled}
              className="font-mono text-xs leading-relaxed"
            />
          </FormField>
        )
      ) : null}

      {showLanguage ? (
        <FormField label="Language" htmlFor={`${idPrefix}-language`}>
          <Input
            id={`${idPrefix}-language`}
            value={values.language}
            onChange={(event) => onChange("language", event.target.value)}
            placeholder="e.g. typescript"
            disabled={disabled}
          />
        </FormField>
      ) : null}

      {showUrl ? (
        <FormField label="URL" htmlFor={`${idPrefix}-url`}>
          <Input
            id={`${idPrefix}-url`}
            type="url"
            value={values.url}
            onChange={(event) => onChange("url", event.target.value)}
            placeholder="https://example.com"
            disabled={disabled}
            required
          />
        </FormField>
      ) : null}

      <FormField
        label="Tags"
        htmlFor={`${idPrefix}-tags`}
        hint="Separate tags with commas."
      >
        <Input
          id={`${idPrefix}-tags`}
          value={values.tags}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="react, hooks, typescript"
          disabled={disabled}
        />
      </FormField>
    </>
  );
}
