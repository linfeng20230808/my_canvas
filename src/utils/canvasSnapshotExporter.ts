import { CanvasNode, CanvasEdge, NodeCategory, CanvasProject } from '../types/canvas';

export interface SnapshotExportResult {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
}

function getNodeHeightEstimate(node: CanvasNode): number {
  if (node.type === 'group') return node.height || 520;
  if (node.height && node.height > 120) return node.height;
  if (node.type === 'storyboard' || node.type === 'video_clip') return 420;
  if (node.type === 'character' || node.type === 'scene_asset') return 350;
  if (node.type === 'storyboard_table') return 360;
  if (node.type === 'script') return 310;
  return 240;
}

function getCategoryAccent(type: NodeCategory): {
  stroke: string;
  badgeBg: string;
  badgeText: string;
  label: string;
} {
  switch (type) {
    case 'character':
      return {
        stroke: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.18)',
        badgeText: '#FBBF24',
        label: '角色锚点 · @Image',
      };
    case 'scene_asset':
      return {
        stroke: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        badgeText: '#34D399',
        label: '场景载具 · @Image',
      };
    case 'script':
      return {
        stroke: '#38BDF8',
        badgeBg: 'rgba(56, 189, 248, 0.18)',
        badgeText: '#7DD3FC',
        label: '分场剧本 · Script',
      };
    case 'storyboard':
    case 'video_clip':
      return {
        stroke: '#A855F7',
        badgeBg: 'rgba(168, 85, 247, 0.18)',
        badgeText: '#C084FC',
        label: '9:16 视觉分镜 · Shot',
      };
    case 'storyboard_table':
      return {
        stroke: '#F43F5E',
        badgeBg: 'rgba(244, 63, 94, 0.18)',
        badgeText: '#FDA4AF',
        label: '七段式分镜统筹表',
      };
    case 'audio_clip':
      return {
        stroke: '#06B6D4',
        badgeBg: 'rgba(6, 182, 212, 0.18)',
        badgeText: '#67E8F9',
        label: '音轨与气口 · @Audio',
      };
    default:
      return {
        stroke: '#A1A1AA',
        badgeBg: 'rgba(161, 161, 170, 0.18)',
        badgeText: '#D4D4D8',
        label: '文本批注 · Note',
      };
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return y;

  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < clean.length; i++) {
    const testLine = line + clean[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.slice(0, Math.max(1, line.length - 1)) + '…', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = clean[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function loadNodeImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 2200);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Renders the entire Infinite Canvas of a project (all nodes, group frames, and Bezier edges)
 * into a high-resolution PNG panoramic snapshot and triggers a file download.
 */
export async function exportProjectPanoramaPng(
  project: CanvasProject,
  options?: {
    darkMode?: boolean;
    triggerDownload?: boolean;
  }
): Promise<SnapshotExportResult> {
  const darkMode = options?.darkMode ?? true;
  const triggerDownload = options?.triggerDownload ?? true;
  const nodes: CanvasNode[] = project.nodes || [];
  const edges: CanvasEdge[] = project.edges || [];

  // 1. Compute world bounding box across all nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 1280;
    maxY = 720;
  } else {
    nodes.forEach((n) => {
      const w = n.width || 300;
      const h = getNodeHeightEstimate(n);
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    });
  }

  const paddingX = 96;
  const paddingY = 84;
  const headerBarHeight = 96;

  const logicalWidth = Math.max(1440, Math.round(maxX - minX + paddingX * 2));
  const logicalHeight = Math.max(
    860,
    Math.round(maxY - minY + paddingY * 2 + headerBarHeight)
  );

  // Use 2x Retina scale while keeping max pixel dimension safe for all browsers (<= 5600px)
  const maxDim = Math.max(logicalWidth, logicalHeight);
  const scale = maxDim * 2 <= 5600 ? 2 : Math.max(1.25, 5600 / maxDim);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.scale(scale, scale);

  // Offset to convert node world coordinates (node.position.x, node.position.y) into snapshot coordinates
  const offsetX = paddingX - minX;
  const offsetY = headerBarHeight + paddingY - minY;

  // Preload any node preview images in parallel
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    nodes.map(async (n) => {
      const imgUrl = n.data.customImage || n.data.imageUrl;
      if (imgUrl) {
        const loaded = await loadNodeImage(imgUrl);
        if (loaded) {
          imageMap.set(n.id, loaded);
        }
      }
    })
  );

  // 2. Draw Background & Dot Grid
  ctx.fillStyle = darkMode ? '#09090B' : '#F8FAFC';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const gridStep = 24;
  ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.09)';
  for (let gx = gridStep; gx < logicalWidth; gx += gridStep) {
    for (let gy = headerBarHeight + gridStep; gy < logicalHeight; gy += gridStep) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Draw Group Nodes (Background Partition Frames)
  const groupNodes = nodes.filter((n) => n.type === 'group');
  const cardNodes = nodes.filter((n) => n.type !== 'group');

  groupNodes.forEach((g) => {
    const gx = g.position.x + offsetX;
    const gy = g.position.y + offsetY;
    const gw = g.width || 600;
    const gh = g.height || 520;

    ctx.save();
    drawRoundedRect(ctx, gx, gy, gw, gh, 22);
    ctx.fillStyle = darkMode
      ? 'rgba(24, 24, 27, 0.45)'
      : 'rgba(241, 245, 249, 0.65)';
    ctx.fill();

    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = darkMode
      ? 'rgba(245, 158, 11, 0.38)'
      : 'rgba(217, 119, 6, 0.45)';
    ctx.stroke();
    ctx.setLineDash([]);

    // Group Header Label
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = darkMode ? '#FBBF24' : '#B45309';
    ctx.fillText(g.data.title || '分类分组区', gx + 20, gy + 28);

    if (g.data.subtitle) {
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = darkMode ? '#A1A1AA' : '#64748B';
      ctx.fillText(g.data.subtitle, gx + 20, gy + 46);
    }
    ctx.restore();
  });

  // 4. Draw Flowing Cubic Bezier Edges (Below Node Cards)
  const nodeMap = new Map<string, CanvasNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  edges.forEach((edge) => {
    const src = nodeMap.get(edge.sourceNodeId);
    const tgt = nodeMap.get(edge.targetNodeId);
    if (!src || !tgt) return;

    const srcH = getNodeHeightEstimate(src);
    const tgtH = getNodeHeightEstimate(tgt);

    const x1 = src.position.x + offsetX + (src.width || 300);
    const y1 = src.position.y + offsetY + Math.min(130, srcH * 0.42);
    const x2 = tgt.position.x + offsetX;
    const y2 = tgt.position.y + offsetY + Math.min(130, tgtH * 0.42);

    const dx = Math.abs(x2 - x1);
    const curvature = Math.max(70, Math.min(240, dx * 0.46));
    const cp1x = x1 + curvature;
    const cp1y = y1;
    const cp2x = x2 - curvature;
    const cp2y = y2;

    let strokeColor = project.edgeColor || '#A1A1AA';
    if (edge.relationType === 'character_ref') strokeColor = '#F59E0B';
    else if (edge.relationType === 'scene_ref') strokeColor = '#10B981';
    else if (edge.relationType === 'script_breakdown') strokeColor = '#38BDF8';
    else if (edge.relationType === 'shot_sequence') strokeColor = '#A855F7';

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = strokeColor;
    ctx.globalAlpha = darkMode ? 0.78 : 0.85;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Source Anchor Dot
    ctx.beginPath();
    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Target Magnetic Injection Ring
    ctx.beginPath();
    ctx.arc(x2, y2, 7.5, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x2, y2, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Edge Midpoint Badge
    if (edge.label) {
      const midX = 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2;
      const midY = 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2;
      ctx.font = '600 10px JetBrains Mono, monospace, sans-serif';
      const labelText = edge.label.slice(0, 18);
      const tw = ctx.measureText(labelText).width + 14;
      drawRoundedRect(ctx, midX - tw / 2, midY - 10, tw, 20, 10);
      ctx.fillStyle = darkMode ? 'rgba(9, 9, 11, 0.92)' : 'rgba(255, 255, 255, 0.94)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      ctx.fillStyle = darkMode ? '#E4E4E7' : '#1E293B';
      ctx.fillText(labelText, midX - tw / 2 + 7, midY + 3.5);
    }
    ctx.restore();
  });

  // 5. Draw All Card Nodes
  cardNodes.forEach((node) => {
    const nx = node.position.x + offsetX;
    const ny = node.position.y + offsetY;
    const nw = node.width || 300;
    const nh = getNodeHeightEstimate(node);
    const accent = getCategoryAccent(node.type);

    ctx.save();

    // Card Shadow & Body
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    drawRoundedRect(ctx, nx, ny, nw, nh, 16);
    ctx.fillStyle = darkMode ? '#18181B' : '#FFFFFF';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = darkMode ? '#27272A' : '#E2E8F0';
    ctx.stroke();

    // Top Accent Strip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(nx, ny, nw, 5, [16, 16, 0, 0]);
    ctx.fillStyle = accent.stroke;
    ctx.fill();
    ctx.restore();

    // Category Badge + Anchor Tag
    ctx.font = '600 10px JetBrains Mono, monospace, sans-serif';
    const anchorInfo = node.data.roleType || node.data.shotNumber;
    const badgeLabel = anchorInfo
      ? `${accent.label.split('·')[0].trim()} · ${anchorInfo}`
      : accent.label;
    const badgeW = Math.min(nw - 32, ctx.measureText(badgeLabel).width + 16);
    drawRoundedRect(ctx, nx + 14, ny + 14, badgeW, 20, 6);
    ctx.fillStyle = accent.badgeBg;
    ctx.fill();
    ctx.fillStyle = accent.badgeText;
    ctx.fillText(badgeLabel, nx + 22, ny + 27.5);

    // Node Title
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = darkMode ? '#F4F4F5' : '#0F172A';
    const titleY = drawWrappedText(
      ctx,
      node.data.title || '未命名节点',
      nx + 14,
      ny + 52,
      nw - 28,
      18,
      2
    );

    let cursorY = titleY + 4;

    // Visual Preview Box for Character / Scene / Storyboard nodes
    const isVisualNode =
      node.type === 'character' ||
      node.type === 'scene_asset' ||
      node.type === 'storyboard' ||
      node.type === 'video_clip';

    if (isVisualNode) {
      const previewH =
        node.type === 'storyboard' || node.type === 'video_clip' ? 168 : 136;
      const previewX = nx + 14;
      const previewY = cursorY;
      const previewW = nw - 28;

      ctx.save();
      drawRoundedRect(ctx, previewX, previewY, previewW, previewH, 10);
      ctx.clip();

      const loadedImg = imageMap.get(node.id);
      if (loadedImg) {
        // Cover-fit image
        const imgRatio = loadedImg.width / Math.max(1, loadedImg.height);
        const boxRatio = previewW / previewH;
        let drawW = previewW;
        let drawH = previewH;
        let drawX = previewX;
        let drawY = previewY;
        if (imgRatio > boxRatio) {
          drawW = previewH * imgRatio;
          drawX = previewX - (drawW - previewW) / 2;
        } else {
          drawH = previewW / imgRatio;
          drawY = previewY - (drawH - previewH) / 2;
        }
        ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
      } else {
        // Stylized cinematic darkroom art banner
        const grad = ctx.createLinearGradient(
          previewX,
          previewY,
          previewX + previewW,
          previewY + previewH
        );
        if (node.type === 'character') {
          grad.addColorStop(0, '#27170A');
          grad.addColorStop(1, '#18181B');
        } else if (node.type === 'scene_asset') {
          grad.addColorStop(0, '#07261E');
          grad.addColorStop(1, '#18181B');
        } else {
          grad.addColorStop(0, '#1E1030');
          grad.addColorStop(1, '#09090B');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(previewX, previewY, previewW, previewH);

        // Decorative lens frame lines
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(previewX + 10, previewY + 10, previewW - 20, previewH - 20);

        ctx.font = 'bold 11px JetBrains Mono, monospace, sans-serif';
        ctx.fillStyle = accent.badgeText;
        ctx.fillText(
          node.data.roleType ||
            node.data.shotNumber ||
            (node.type === 'storyboard' ? '9:16 STORYBOARD SHOT' : 'ASSET ANCHOR'),
          previewX + 18,
          previewY + previewH / 2 - 4
        );
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillText(
          (node.data.subtitle || node.data.shotSize || '工业级视觉锚点已挂载').slice(0, 26),
          previewX + 18,
          previewY + previewH / 2 + 14
        );
      }
      ctx.restore();

      cursorY += previewH + 12;
    }

    // Metadata / Camera Parameters Row for Storyboard Shots
    if (node.type === 'storyboard' || node.type === 'video_clip') {
      const tags = [
        node.data.shotSize,
        node.data.cameraMove,
        node.data.durationSec ? `${node.data.durationSec}s` : undefined,
        node.data.focalLength,
      ].filter(Boolean) as string[];

      let tx = nx + 14;
      ctx.font = '10px JetBrains Mono, monospace, sans-serif';
      tags.slice(0, 3).forEach((t) => {
        const tw = ctx.measureText(t).width + 12;
        if (tx + tw <= nx + nw - 14) {
          drawRoundedRect(ctx, tx, cursorY, tw, 18, 5);
          ctx.fillStyle = darkMode ? '#27272A' : '#F1F5F9';
          ctx.fill();
          ctx.fillStyle = darkMode ? '#D4D4D8' : '#334155';
          ctx.fillText(t, tx + 6, cursorY + 12.5);
          tx += tw + 6;
        }
      });
      cursorY += 28;
    }

    // Main Content Summary (Script / Prompt / Dialogue)
    const bodyText =
      node.data.dialogueSnippet ||
      node.data.scriptBody ||
      node.data.visualPrompt ||
      node.data.consistencyPrompt ||
      node.data.textNoteContent ||
      node.data.noteText ||
      node.data.subtitle ||
      '';

    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = darkMode ? '#A1A1AA' : '#475569';
    const remainingHeight = Math.max(36, ny + nh - cursorY - 14);
    const maxLines = Math.max(2, Math.min(7, Math.floor(remainingHeight / 16)));
    drawWrappedText(ctx, bodyText, nx + 14, cursorY + 10, nw - 28, 16, maxLines);

    ctx.restore();
  });

  // 6. Draw Top Panoramic Header Bar
  ctx.save();
  ctx.fillStyle = darkMode ? '#121215' : '#FFFFFF';
  ctx.fillRect(0, 0, logicalWidth, headerBarHeight);

  ctx.strokeStyle = darkMode ? '#27272A' : '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, headerBarHeight);
  ctx.lineTo(logicalWidth, headerBarHeight);
  ctx.stroke();

  // Brand Emblem Box
  drawRoundedRect(ctx, 28, 22, 52, 52, 14);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#09090B';
  ctx.fillText('FV', 41, 55);

  // Project Title & Subtitle
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = darkMode ? '#FAFAFA' : '#0F172A';
  const headerTitle = `${project.name} · ${project.episodeTitle || 'EP01'} — AI 短剧无限画布全景看板`;
  ctx.fillText(headerTitle, 94, 46);

  ctx.font = '12px JetBrains Mono, monospace, sans-serif';
  ctx.fillStyle = darkMode ? '#A1A1AA' : '#64748B';
  const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
  const metaLine = `题材: ${project.genreTag || 'AI短剧'}  |  画幅: ${
    project.aspectRatio || '9:16'
  }  |  节点总数: ${cardNodes.length} 个  |  拓扑连线: ${
    edges.length
  } 条  |  快照导出时间: ${timestamp}`;
  ctx.fillText(metaLine, 94, 68);

  // Right Watermark Tag
  const rightBadge = '帧界 FrameVerse · 漫剧老李 180° 工业级分镜拓扑快照';
  ctx.font = '600 11px JetBrains Mono, monospace, sans-serif';
  const rbw = ctx.measureText(rightBadge).width + 24;
  drawRoundedRect(ctx, logicalWidth - rbw - 28, 30, rbw, 34, 10);
  ctx.fillStyle = darkMode ? '#18181B' : '#F1F5F9';
  ctx.fill();
  ctx.strokeStyle = darkMode ? '#3F3F46' : '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = darkMode ? '#FBBF24' : '#B45309';
  ctx.fillText(rightBadge, logicalWidth - rbw - 16, 51);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const safeName = project.name
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `${safeName || 'frameverse'}-画布全景快照-${Date.now()}.png`;

  if (triggerDownload) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  }

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    fileName,
  };
}
