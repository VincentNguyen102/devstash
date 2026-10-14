"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEditorPreferences } from "@/hooks/use-editor-preferences";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_OPTIONS,
  type EditorThemeId,
} from "@/lib/editor-preferences";

interface SettingRowProps {
  label: string;
  description: string;
  /** Id of the control so the label focuses/toggles it. */
  htmlFor: string;
  children: ReactNode;
}

function SettingRow({ label, description, htmlFor, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * The editor-preferences section of the settings page. Every control auto-saves
 * through `useEditorPreferences` (no save button) and is disabled mid-save so
 * two updates never race.
 */
export function EditorPreferencesCard() {
  const { preferences, isSaving, updatePreferences } = useEditorPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor preferences</CardTitle>
        <CardDescription>
          Customize the code editor. Changes are saved automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SettingRow
          label="Font size"
          description="Text size used in the code editor."
          htmlFor="editor-font-size"
        >
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(value) =>
              void updatePreferences({ fontSize: Number(value) })
            }
            disabled={isSaving}
          >
            <SelectTrigger id="editor-font-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_FONT_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Tab size"
          description="Number of spaces a tab inserts."
          htmlFor="editor-tab-size"
        >
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(value) =>
              void updatePreferences({ tabSize: Number(value) })
            }
            disabled={isSaving}
          >
            <SelectTrigger id="editor-tab-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_TAB_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Theme"
          description="Color theme for the code editor."
          htmlFor="editor-theme"
        >
          <Select
            value={preferences.theme}
            onValueChange={(value) =>
              void updatePreferences({ theme: value as EditorThemeId })
            }
            disabled={isSaving}
          >
            <SelectTrigger id="editor-theme" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Word wrap"
          description="Wrap long lines instead of scrolling horizontally."
          htmlFor="editor-word-wrap"
        >
          <Switch
            id="editor-word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) =>
              void updatePreferences({ wordWrap: checked })
            }
            disabled={isSaving}
          />
        </SettingRow>

        <SettingRow
          label="Minimap"
          description="Show the code overview gutter on the right."
          htmlFor="editor-minimap"
        >
          <Switch
            id="editor-minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) =>
              void updatePreferences({ minimap: checked })
            }
            disabled={isSaving}
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}
