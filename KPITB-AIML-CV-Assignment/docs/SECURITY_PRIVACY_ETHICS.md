# Security, Privacy, Ethics, and Licensing

## Responsible Positioning

VisionShield is an AI-assisted decision-support prototype. It reports observable
objects and deterministic contextual rules for human review. It must not be the
sole basis for disciplinary, employment, legal, access-control, or emergency
decisions.

## Prohibited Capabilities

- Facial recognition or identity inference.
- Protected-attribute, emotion, or health inference.
- Cross-camera person matching.
- Criminality, terrorism, intent, or generalized suspiciousness scoring.
- Silent appearance embedding retention.
- Automated enforcement or alarm dispatch.

## Data Privacy

- Obtain facility permission and required participant notice/consent.
- Do not record audio.
- Avoid private spaces and unnecessary face detail.
- Use staged safe scenarios; never manufacture a real hazard.
- Keep raw footage outside Git and public object storage.
- Use a private Roboflow workspace for identifiable footage.
- Define raw, annotated, test, evidence, and output retention periods.
- Remove EXIF metadata from public demo exports.
- Use only licensed/authorized media in GitHub, LinkedIn, and presentations.
- Do not persist ReID embeddings.

## Upload and Decoder Security

- Allowlist file types and validate content signature, not extension alone.
- Bound file size, image dimensions, video duration, frame count, and FPS.
- Reject decompression bombs and malformed media.
- Use random server-side filenames and no user-controlled paths.
- Isolate FFmpeg/OpenCV decode in constrained non-root workers.
- Apply CPU, memory, time, and concurrency limits.
- Delete temporary files in success and failure paths.
- Never allow arbitrary user model/checkpoint uploads.
- Never load untrusted pickle-based model artifacts.

## API and Dashboard Security

- OIDC Authorization Code + PKCE and MFA for product phase.
- Site-scoped RBAC, not role-only authorization.
- Validate every request with typed schemas.
- Restrict CORS and WebSocket origins.
- Rate limit uploads, inference, login, export, and evidence access.
- Use short-lived signed evidence URLs.
- Never return RTSP URLs or secrets to browsers.
- Sanitize logs; no tokens, media content, or extracted text.
- Record all config, model, rule, review, and evidence-access actions.
- PostgreSQL RLS is defense in depth; runtime role cannot own protected tables.

## RTSP and Worker Threats

- Restrict URI scheme and outbound destinations to prevent SSRF.
- Block loopback, link-local, metadata-service, and unauthorized private ranges.
- Keep camera credentials in a secret manager reference.
- Use patched FFmpeg and minimal protocols.
- Run media workers separately from API/dashboard.
- Bound queues and drop stale frames rather than accumulating memory.
- Verify model hashes at worker startup.

## ML Threats

- Dataset poisoning and annotation manipulation.
- Untrusted pretrained checkpoints and dependency compromise.
- Adversarial patterns and intentional occlusion.
- Distribution shift after camera movement or lighting change.
- Model extraction through unrestricted APIs.
- Result artifact tampering.
- Denial of service through large or pathological media.

Mitigations include provenance, restricted promotion, artifact hashes, locked
evaluation, scene-change health checks, request limits, and human review.

## Fairness and Worker Impact

- Do not infer protected attributes.
- Evaluate performance across relevant clothing, body size, mobility aids,
  camera heights, visibility, and lighting without storing sensitive labels in
  operational events.
- Unknown PPE visibility is not noncompliance.
- Provide review, correction, and appeal processes before real deployment.
- Monitor false-positive reasons by camera and rule.

## Licensing Inventory

Track separately:

1. Original application code.
2. Third-party dependencies.
3. Source images/videos.
4. Annotations.
5. Pretrained model weights.
6. Fine-tuned weights.
7. Demo and presentation media.

Ultralytics public software is AGPL-3.0; proprietary deployment may require an
Enterprise license. Coursework/open-source use still requires license review and
attribution. A downloadable dataset without an explicit license is blocked.

## Required Disclosures

- Completed disclosure generated from `templates/DATASET_CARD.md`
- Completed disclosure generated from `templates/MODEL_CARD.md`
- Data provenance ledger
- Dependency/license inventory
- Privacy impact assessment
- Threat model
- AI assistance disclosure
- Known limitations
- Human review requirement

The release manifest must name the final disclosure paths. The Roboflow review
must cover upload authority, workspace access, service data-use terms,
retention/deletion, export/project deletion, and applicable organizational or
cross-border restrictions, not only the workspace visibility setting.

## Governance References

- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- NIST Privacy Framework: https://www.nist.gov/privacy-framework
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP ML Security Top 10: https://owasp.org/www-project-machine-learning-security-top-10/
- Ultralytics license: https://www.ultralytics.com/license
