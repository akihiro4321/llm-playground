import type { PresetId, PresetOption } from "@/entities/message";
import type { KnowledgeDocSummary } from "@/shared/api/knowledge";

type SystemPromptSettingsProps = {
  presetOptions: PresetOption[];
  presetId: PresetId;
  onPresetChange: (preset: PresetId) => void;
  customSystemPrompt: string;
  onCustomSystemPromptChange: (value: string) => void;
  useKnowledge: boolean;
  onUseKnowledgeChange: (value: boolean) => void;
  availableDocs: KnowledgeDocSummary[];
  selectedDocIds: string[];
  onDocToggle: (docId: string) => void;
};

function SystemPromptSettings({
  presetOptions,
  presetId,
  onPresetChange,
  customSystemPrompt,
  onCustomSystemPromptChange,
  useKnowledge,
  onUseKnowledgeChange,
  availableDocs,
  selectedDocIds,
  onDocToggle,
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
      <label className="knowledge-toggle">
        <input
          type="checkbox"
          checked={useKnowledge}
          onChange={(e) => onUseKnowledgeChange(e.target.checked)}
        />
        <span>ドキュメントを参照して回答する</span>
      </label>
      <div className="doc-selector">
        <div className="system-prompt__header">対象ドキュメント</div>
        <p className="doc-selector__hint">未選択の場合は全ドキュメントを検索します。</p>
        <div className="doc-options">
          {availableDocs.length === 0 ? (
            <span className="doc-option doc-option--empty">
              利用可能なドキュメントが見つかりませんでした
            </span>
          ) : (
            availableDocs.map((doc) => (
              <label key={doc.id} className="doc-option">
                <input
                  type="checkbox"
                  checked={selectedDocIds.includes(doc.id)}
                  onChange={() => onDocToggle(doc.id)}
                  disabled={!useKnowledge}
                />
                <span>{doc.title}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemPromptSettings;
