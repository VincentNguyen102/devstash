"use client";

import type { ReactNode } from "react";

import { AiDescriptionButton } from "@/components/dashboard/ai-description-button";
import { AiTagSuggestions } from "@/components/dashboard/ai-tag-suggestions";
import { CodeEditor } from "@/components/ui/code-editor";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CODE_TYPE_IDS,
  CONTENT_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
  URL_TYPE_IDS,
} from "@/lib/item-type-fields";
import {
  languageOptionsFor,
  toLanguageValue,
} from "@/lib/languages";

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
  /** Current title, used by the AI tag suggester and description generator. */
  aiTitle: string;
  /** Uploaded file name, used by the AI description generator. */
  aiFileName?: string;
  /** Disables every control while a form is submitting. */
  disabled?: boolean;
  /** Rendered between Description and Content (e.g. the upload field). */
  afterDescription?: ReactNode;
}

/**
 * The type-aware field set shared by the New Item dialog and the drawer's
 * inline edit form: Description, Language, the per-type content editor
 * (Monaco/Markdown/textarea), URL and Tags. Language sits above Content so the
 * highlighting choice is visible before typing. The title and upload fields
 * stay in their respective callers.
 */
export function ItemFormFields({
  typeId,
  values,
  onChange,
  idPrefix,
  aiTitle,
  aiFileName,
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
      <FormField
        label="Description"
        htmlFor={`${idPrefix}-description`}
        action={
          <AiDescriptionButton
            title={aiTitle}
            typeId={typeId}
            language={values.language}
            content={values.content}
            url={values.url}
            fileName={aiFileName}
            tags={values.tags}
            onDescriptionChange={(description) =>
              onChange("description", description)
            }
            disabled={disabled}
          />
        }
      >
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

      {showLanguage ? (
        <FormField label="Language" htmlFor={`${idPrefix}-language`}>
          <Select
            value={toLanguageValue(values.language) ?? ""}
            onValueChange={(value) => onChange("language", value)}
            disabled={disabled}
          >
            <SelectTrigger id={`${idPrefix}-language`} className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptionsFor(values.language).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : null}

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
        <AiTagSuggestions
          title={aiTitle}
          content={values.content || values.description}
          tags={values.tags}
          onTagsChange={(tags) => onChange("tags", tags)}
          disabled={disabled}
        />
      </FormField>
    </>
  );
}
