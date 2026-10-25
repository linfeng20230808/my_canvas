import { NodeCategory, ShotAspectRatio } from '../types/canvas';

export interface DramaStylePreset {
  id: string;
  name: string;
  category: '3D漫剧' | '2D动漫' | '真人电影短剧' | '类型美学';
  badge: string;
  colorSwatches: [string, string, string];
  lightingPrompt: string;
  stylePrompt: string;
  negativeAvoid: string;
  description: string;
}

export interface DirectorFormulaPreset {
  id: string;
  name: string;
  targetType: NodeCategory | 'all';
  badge: string;
  shotSize?: string;
  cameraMove?: string;
  focalLength?: string;
  aspectRatio?: ShotAspectRatio;
  formulaBlock: string;
  description: string;
}

export const DRAMA_STYLE_PRESETS: DramaStylePreset[] = [
  {
    id: 'style-3d-ue5-xianxia',
    name: 'UE5 3D国漫巅峰 (凡人/吞噬风)',
    category: '3D漫剧',
    badge: '3D CG · 爆款漫剧',
    colorSwatches: ['#F59E0B', '#38BDF8', '#09090B'],
    lightingPrompt: 'Volumetric god rays, subsurface skin scattering, rim light 6500K + golden particle glow 3200K',
    stylePrompt:
      'Unreal Engine 5.4 3D Chinese Donghua CG, ultra-detailed PBR textures, physically based hair strands, cinematic depth of field, IMAX 8K render',
    negativeAvoid: '2D flat cartoon, low-poly, plastic skin, deformed fingers, blurry face',
    description: '适用于修真玄幻、末日机甲、吞噬星空类高燃 3D 竖屏漫剧，皮肤次表面散射与金属质感极佳。',
  },
  {
    id: 'style-wasteland-industrial',
    name: '废土重工末日求生 (高反差烈日)',
    category: '类型美学',
    badge: '末日求生 · 工业写实',
    colorSwatches: ['#D97706', '#0284C7', '#18181B'],
    lightingPrompt: '4500K harsh desert sunlight colliding with 6500K cold holographic system UI glow',
    stylePrompt:
      'Wasteland Survival Cinema, Mad Max industrial grit, weathered cast-iron & oil stains, swirling sandstorm particles, Anamorphic 35mm lens',
    negativeAvoid: 'clean studio background, oversaturated cartoon colors, broken mechanical gears',
    description: '专为《公路求生》等末日载具、机械制造、荒野求生题材打造，冷暖双色温强烈对撞。',
  },
  {
    id: 'style-2d-cyber-anime',
    name: '2D 高反差剧场版日漫 (UFOtable风)',
    category: '2D动漫',
    badge: '2D 剧场版 · 刀光特效',
    colorSwatches: ['#818CF8', '#F43F5E', '#0F172A'],
    lightingPrompt: 'High-contrast neon rim lighting, bloom effect, dynamic speed lines and impact frames',
    stylePrompt:
      'Masterpiece 2D theatrical anime style, Ufotable digital compositing, crisp cel-shading with deep ambient occlusion, dramatic camera perspective',
    negativeAvoid: '3D uncanny valley, washed out colors, extra limbs, off-model face',
    description: '适用于高燃战斗、异能觉醒、都市异能漫剧，强化手绘张力与特效粒子摄影感。',
  },
  {
    id: 'style-live-action-noir',
    name: 'Arri 真人暗调电影短剧 (悬疑/逆袭)',
    category: '真人电影短剧',
    badge: '真人实拍 · 电影暗调',
    colorSwatches: ['#FBBF24', '#1E293B', '#09090B'],
    lightingPrompt: 'Chiaroscuro Rembrandt lighting, 3200K warm tungsten key light + cold rain window reflection',
    stylePrompt:
      'Shot on ARRI Alexa Mini LF with Cooke Anamorphic lens, photorealistic East Asian cinema, natural skin pores, shallow DOF f/1.4, Kodak 2383 film grading',
    negativeAvoid: 'CGI plastic look, anime, illustration, over-smoothed beauty filter',
    description: '适用于都市豪门逆袭、悬疑犯罪、情感反转类真人竖屏短剧，具备院线级光影层次。',
  },
  {
    id: 'style-oriental-ink-wuxia',
    name: '新国风暗黑水墨武侠 (不良人/剑来风)',
    category: '2D动漫',
    badge: '国风武侠 · 水墨金芒',
    colorSwatches: ['#E11D48', '#D4AF37', '#171717'],
    lightingPrompt: 'Dramaticcrimson & gold rim light cutting through ink-wash fog',
    stylePrompt:
      'Oriental dark wuxia aesthetic, traditional Chinese ink brush strokes fused with 3D cel-shaded martial arts cinematography, flowing silk & ink splashes',
    negativeAvoid: 'western medieval armor, modern buildings, stiff posture',
    description: '适用于古风权谋、武侠剑道、东方志怪短剧，水墨留白与凌厉冷兵器锋芒兼具。',
  },
  {
    id: 'style-weird-rules-horror',
    name: '规则怪谈/中式微恐冷调 (高沉浸)',
    category: '类型美学',
    badge: '规则怪谈 · 心理悬疑',
    colorSwatches: ['#10B981', '#EF4444', '#09090B'],
    lightingPrompt: 'Flickering fluorescent corridor light 5600K + eerie crimson warning glow',
    stylePrompt:
      'Psychological thriller cinematography, uncanny liminal space, subtle chromatic aberration, handheld documentary tension, ultra-sharp facial micro-expressions',
    negativeAvoid: 'bright cheerful lighting, cartoon proportions, low contrast',
    description: '适用于无限流、规则怪谈、惊悚解谜短剧，强化瞳孔微表情与空间压迫感。',
  },
];

export const DIRECTOR_FORMULA_PRESETS: DirectorFormulaPreset[] = [
  {
    id: 'preset-char-4view-lock',
    name: '角色四视图定妆锁脸预设 (@Image1)',
    targetType: 'character',
    badge: '四视图 · 骨相锁死',
    aspectRatio: '16:9',
    formulaBlock:
      '[Character Turnaround Sheet: 01.Front Full-Body View | 02.90° Side Profile View | 03.Back View | 04.Extreme Close-Up Facial Anchor Lock] + [Bone Structure & Eye Spacing Locked, Consistent Costume & Accessories, Neutral Grey Studio Backdrop, 8K Reference Sheet]',
    description: '一键生成标准四视图角色资产设定词，供下游所有分镜通过 @Image1 锁定五官与服装。',
  },
  {
    id: 'preset-scene-axis-lock',
    name: '场景空间基准与180°轴线锚点 (@Image2)',
    targetType: 'scene_asset',
    badge: '空间锚点 · 轴线基准',
    aspectRatio: '16:9',
    formulaBlock:
      '[Environment Master Establishing Shot & Prop Orthographic Reference] + [180-Degree Camera Axis Baseline Locked: Left-to-Right Spatial Orientation, Primary Key Light Direction Fixed, Architectural & Mechanical Proportions Locked]',
    description: '锁死场景主光源方向、空间透视与核心载具/道具机械结构，杜绝多镜头场景跳变。',
  },
  {
    id: 'preset-shot-ecu-hook',
    name: '黄金前3秒 · 极特写瞳孔震颤 (ECU Hook)',
    targetType: 'storyboard',
    badge: '文戏爆发 · FACS微表情',
    shotSize: '极特写 (ECU)',
    cameraMove: '[Push in, Rack focus]',
    focalLength: '85mm f/1.2 Macro',
    aspectRatio: '9:16',
    formulaBlock:
      '[站位声明: 严格锁定180°轴线] | [FACS微表情六阶段: 0.0s平静基准 → 0.5s瞳孔骤缩(AU5) → 1.2s眉心死锁(AU4) → 2.0s下颌绷紧冷笑(AU12/AU17)] | [Camera: Rapid Push-in to Extreme Close-Up on eyes reflecting hologram]',
    description: '短剧开局黄金前3秒留人利器，聚焦瞳孔倒影与 FACS 面部肌肉微表情递进。',
  },
  {
    id: 'preset-shot-ots-confrontation',
    name: '双人越肩对峙 · 180°轴线压迫 (OTS)',
    targetType: 'storyboard',
    badge: '双人对手戏 · 严禁越轴',
    shotSize: '越肩中近景 (OTS)',
    cameraMove: '[Dolly in slowly, Subtle Dutch tilt]',
    focalLength: '50mm f/1.4 Anamorphic',
    aspectRatio: '9:16',
    formulaBlock:
      '[站位声明: 主角(@Image1)严格居左前景背肩，对手居右中景面向左，严禁跨越180°视觉轴线] | [景深控制: 前景肩膀微虚化，焦点精准咬合受话方眼神变化与嘴角抽动]',
    description: '符合漫剧老李 180° 轴线铁律的双人对话/博弈分镜模板，正反打切镜丝滑不跳戏。',
  },
  {
    id: 'preset-shot-combat-7states',
    name: '高燃武戏 · 动作七态与抽帧顿帧 (Action)',
    targetType: 'storyboard',
    badge: '武戏拆格 · 打击感拉满',
    shotSize: '中全景转极特写 (MWS → ECU)',
    cameraMove: '[Whip pan, Orbit 180, Speed ramp]',
    focalLength: '24mm f/1.8 Wide Dynamic',
    aspectRatio: '9:16',
    formulaBlock:
      '[动作七态拆格: 0.0s起势蓄力 → 0.8s极速突进(残影) → 1.4s交锋碰撞(抽2帧+0.15s黑白闪顿帧+冲击波扩散) → 2.2s受击形变飞退 → 3.0s硬直卸力收势定格] | [物理交互: 地面碎石迸溅与衣摆逆风撕裂]',
    description: '内置动作戏「起势-蓄力-突进-交锋-受击-卸力-收势」七态与抽帧顿帧指令，专治 AI 打戏软绵绵。',
  },
  {
    id: 'preset-script-golden-3s',
    name: '短剧分场剧本 · 黄金3秒钩子+断章反转模板',
    targetType: 'script',
    badge: '剧本骨架 · 完播率引擎',
    formulaBlock: `【0-3秒视觉强钩子】：开篇第一帧直接呈现生死危机/羞辱打脸/神级觉醒反差画面！
【3-10秒冲突升级】：反派步步紧逼或系统弹出唯一隐藏规则，情绪压迫感拉满。
【10-15秒底牌亮出/断章悬念】：主角冷笑亮出跨维度底牌，在最高潮瞬间戛然而止留钩！`,
    description: '标准竖屏爽剧分场剧本结构模板，确保每一场戏都具备明确的爽点钩子与结尾反转。',
  },
];
