<!-- Media Upload Modal -->
<div class="media-modal" id="mediaModal">
    <div class="media-modal-content">
        <div class="media-modal-header">
            <h3>Attach Media to Question</h3>
            <button class="media-close" id="mediaClose">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="media-modal-body">
            <div class="media-upload-zone" id="mediaUploadZone">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 1rem;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <h4>Upload Image or Video</h4>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.5rem 0;">Drag & drop or click to browse</p>
                <input type="file" id="mediaFileInput" accept="image/*,video/*" style="display: none;">
                <button class="btn btn-primary" onclick="document.getElementById('mediaFileInput').click()">Choose File</button>
            </div>
            <div id="mediaPreview" style="display: none; margin-top: 1.5rem;">
                <div id="mediaPreviewContent"></div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" id="removeMediaBtn">Remove</button>
                    <button class="btn btn-primary" id="saveMediaBtn">Attach to Question</button>
                </div>
            </div>
        </div>
    </div>
</div>

