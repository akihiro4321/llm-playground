import type { PresetId, PresetOption } from "../types/chat";

type SystemPromptSettingsProps = {
  presetOptions: PresetOption[];
  presetId: PresetId;
  onPresetChange: (preset: PresetId) => void;
  customSystemPrompt: string;
  onCustomSystemPromptChange: (value: string) => void;
};

function SystemPromptSettings({
  presetOptions,
  presetId,
  onPresetChange,
  customSystemPrompt,
  onCustomSystemPromptChange,
}: SystemPromptSettingsProps) {
  return (
    <div className="system-prompt">
      <div className="system-prompt__header">プリセット</div>
      <div className="preset-options">
        {presetOptions.map((preset) => (
          <label key={preset.id} className="preset-option">
            <input
              type="radio"
              name="preset"
              value={preset.id}
              checked={presetId === preset.id}
              onChange={() => onPresetChange(preset.id)}
            />
            <span className="preset-label">{preset.label}</span>
          </label>
        ))}
      </div>
      <div className="custom-prompt">
        <label htmlFor="customPrompt">カスタムプロンプト（入力がある場合はこちらを優先）</label>
        <textarea
          id="customPrompt"
          value={customSystemPrompt}
          onChange={(e) => onCustomSystemPromptChange(e.target.value)}
          placeholder="例: あなたは関西弁で話すアシスタントです。"
          rows={4}
        />
      </div>
    </div>
  );
}

export default SystemPromptSettings;
