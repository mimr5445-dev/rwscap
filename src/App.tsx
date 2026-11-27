import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActiveTool,
  ClipAnimation,
  ClipTransform,
  ClipTransition,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CLIP_TRANSFORM,
  DEFAULT_EXPORT_SETTINGS,
  ExportSettings,
  ProjectState,
  VideoClip,
} from './types/editor';
import {
  extractVideoMetadataAndThumbs,
  generateDemoThumbnails,
  getActiveClipAtTime,
  getTotalDuration,
  MediaElementCache,
  renderCompositeFrame,
} from './utils/demoRenderer';
import { audioEngine } from './utils/audioSynth';
import {
  changeClipSpeed,
  deleteClipById,
  duplicateClipById,
  insertFreezeFrameAtTime,
  reorderClip,
  setClipAnimation,
  setClipTransform,
  setClipTransition,
  splitClipAtTime,
  trimClipEdge,
} from './utils/timelineOps';
import {
  clearProjectLocalStorage,
  deserializeProjectJson,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  serializeProjectJson,
} from './utils/projectStorage';
import { clamp } from './utils/time';
import { TopBar } from './components/TopBar';
import { PreviewStage } from './components/PreviewStage';
import { TransportBar } from './components/TransportBar';
import { Timeline } from './components/Timeline';
import { BottomToolbar } from './components/BottomToolbar';
import { AdjustPanel } from './components/panels/AdjustPanel';
import { FilterPanel } from './components/panels/FilterPanel';
import { AspectPanel } from './components/panels/AspectPanel';
import { BackgroundPanel } from './components/panels/BackgroundPanel';
import { StickersPanel } from './components/panels/StickersPanel';
import { TextPanel } from './components/panels/TextPanel';
import { CaptionsPanel } from './components/panels/CaptionsPanel';
import { AudioPanel } from './components/panels/AudioPanel';
import { OverlayPanel } from './components/panels/OverlayPanel';
import { SpeedPanel, VolumePanel } from './components/panels/ClipControlsPanel';
import { TransitionPanel } from './components/panels/TransitionPanel';
import { TransformPanel } from './components/panels/TransformPanel';
import { AnimationPanel } from './components/panels/AnimationPanel';
import { ExportModal } from './components/modals/ExportModal';
import { CoverModal } from './components/modals/CoverModal';
import { SearchModal } from './components/modals/SearchModal';
import { MediaAddModal, ProjectModal } from './components/modals/ProjectModal';

function createInitialProject(): ProjectState {
  const demoThumbs =
    typeof document !== 'undefined' ? generateDemoThumbnails('worldmap', 9, 10) : [];
  return {
    clips: [
      {
        id: 'clip-initial-1',
        type: 'demo',
        name: 'خريطة العالم الرقمية',
        sourceStart: 0,
        duration: 9,
        maxDuration: 18,
        speed: 1,
        volume: 100,
        demoVariant: 'worldmap',
        thumbnails: demoThumbs,
      },
    ],
    audioClips: [],
    textItems: [],
    stickers: [],
    overlays: [],
    mutedMain: false,
    coverTime: 0.4,
    aspectRatio: '16:9',
    background: {
      mode: 'none',
      value: '#000000',
      blurAmount: 18,
    },
    filter: {
      id: 'original',
      intensity: 80,
    },
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  };
}

function hydrateInitialSession(): {
  project: ProjectState;
  exportSettings: ExportSettings;
  savedAt: string | null;
} {
  const restored = loadProjectFromLocalStorage();
  if (restored) {
    // Regenerate crisp demo thumbnails if any demo clip has empty thumbnails
    const hydratedClips = restored.project.clips.map((c) => {
      if (c.type === 'demo' && c.thumbnails.length === 0) {
        return {
          ...c,
          thumbnails: generateDemoThumbnails(c.demoVariant || 'worldmap', c.duration, 8),
        };
      }
      return c;
    });
    return {
      project: { ...restored.project, clips: hydratedClips },
      exportSettings: restored.exportSettings,
      savedAt: new Date(restored.savedAt).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }
  return {
    project: createInitialProject(),
    exportSettings: DEFAULT_EXPORT_SETTINGS,
    savedAt: null,
  };
}

export default function App() {
  const initialSession = useMemo(() => hydrateInitialSession(), []);
  const [project, setProject] = useState<ProjectState>(initialSession.project);
  const [past, setPast] = useState<ProjectState[]>([]);
  const [future, setFuture] = useState<ProjectState[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSession.savedAt);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const [exportSettings, setExportSettings] = useState<ExportSettings>(
    initialSession.exportSettings,
  );
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [transitionClipId, setTransitionClipId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [showExport, setShowExport] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showMediaAdd, setShowMediaAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mediaCacheRef = useRef<MediaElementCache>({
    videos: new Map(),
    images: new Map(),
  });
  const createdObjectUrlsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);
  const playRafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number>(0);
  const autoSaveTimerRef = useRef<number | null>(null);

  const totalDuration = useMemo(() => getTotalDuration(project.clips), [project.clips]);

  const registerObjectUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) createdObjectUrlsRef.current.add(url);
  }, []);

  const revokeAllObjectUrls = useCallback(() => {
    createdObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdObjectUrlsRef.current.clear();
    mediaCacheRef.current.videos.clear();
    mediaCacheRef.current.images.clear();
  }, []);

  // Revoke transient blob URLs on unmount to prevent memory leaks
  useEffect(() => revokeAllObjectUrls, [revokeAllObjectUrls]);

  // Debounced automatic persistence to localStorage (800ms)
  useEffect(() => {
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      if (saveProjectToLocalStorage(project, exportSettings)) {
        setLastSavedAt(
          new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        );
      }
    }, 800);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [project, exportSettings]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const lastCommitTsRef = useRef<number>(0);

  /** Commit a discrete edit onto the Undo/Redo history stack (coalescing rapid slider drags) */
  const commit = useCallback(
    (updater: (prev: ProjectState) => ProjectState, coalesce = false) => {
      const now = Date.now();
      setProject((prev) => {
        const next = updater(prev);
        if (!coalesce || now - lastCommitTsRef.current > 450) {
          setPast((p) => [...p.slice(-39), prev]);
          setFuture([]);
        }
        lastCommitTsRef.current = now;
        return next;
      });
    },
    [],
  );

  const handleUndo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [project, ...f]);
      setProject(previous);
      showToast('تم التراجع');
      return p.slice(0, -1);
    });
  }, [project, showToast]);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, project]);
      setProject(next);
      showToast('تمت الإعادة');
      return f.slice(1);
    });
  }, [project, showToast]);

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      audioEngine.stopAll();
      return;
    }

    if (!project.mutedMain) {
      audioEngine.startPlayback(project.audioClips, currentTime);
    }
    lastFrameTsRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastFrameTsRef.current) / 1000);
      lastFrameTsRef.current = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      playRafRef.current = requestAnimationFrame(tick);
    };

    playRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      audioEngine.stopAll();
    };
  }, [isPlaying, totalDuration, project.audioClips, project.mutedMain]);

  // Pause looping playback when tab/window moves off-screen
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const handleSplitSelectedClip = useCallback(() => {
    const result = splitClipAtTime(project.clips, currentTime);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commit((prev) => ({ ...prev, clips: result.clips }));
    setSelectedClipId(result.newSelectedId);
    showToast('تم تقسيم المقطع');
  }, [project.clips, currentTime, commit, showToast]);

  const handleDeleteClip = useCallback(() => {
    if (!selectedClipId) return;
    const result = deleteClipById(project.clips, selectedClipId);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commit((prev) => ({ ...prev, clips: result.clips }));
    setSelectedClipId(null);
    setActiveTool(null);
    showToast('تم حذف المقطع');
  }, [selectedClipId, project.clips, commit, showToast]);

  // Pro Keyboard Shortcuts (Space, Arrows, S split, M mute, Delete, Ctrl/Cmd+Z, ?)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape' && fullscreen) {
        e.preventDefault();
        setFullscreen(false);
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentTime((t) => clamp(Number((t - 0.25).toFixed(2)), 0, totalDuration));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentTime((t) => clamp(Number((t + 0.25).toFixed(2)), 0, totalDuration));
      } else if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSplitSelectedClip();
      } else if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        commit((prev) => ({ ...prev, mutedMain: !prev.mutedMain }));
        showToast(project.mutedMain ? 'تم تشغيل الصوت' : 'تم كتم الصوت');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowProjectMenu(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId) {
          e.preventDefault();
          commit((prev) => ({
            ...prev,
            textItems: prev.textItems.filter((t) => t.id !== selectedLayerId),
            stickers: prev.stickers.filter((s) => s.id !== selectedLayerId),
          }));
          setSelectedLayerId(null);
          showToast('تم حذف الطبقة المحددة');
        } else if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleUndo,
    handleRedo,
    fullscreen,
    totalDuration,
    handleSplitSelectedClip,
    commit,
    project.mutedMain,
    showToast,
    selectedLayerId,
    selectedClipId,
    handleDeleteClip,
  ]);

  // Cover thumbnail preview
  const coverPreviewUrl = useMemo(() => {
    if (project.customCoverUrl) return project.customCoverUrl;
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    renderCompositeFrame(ctx, 160, 160, project, project.coverTime, mediaCacheRef.current);
    return canvas.toDataURL('image/jpeg', 0.72);
  }, [project.customCoverUrl, project.coverTime, project.clips, project.filter, project.adjustments]);

  // Clamp currentTime if clips shrink
  useEffect(() => {
    if (currentTime > totalDuration) {
      setCurrentTime(totalDuration);
    }
  }, [totalDuration, currentTime]);

  const handleTogglePlay = () => {
    if (currentTime >= totalDuration - 0.05) {
      setCurrentTime(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleImportFiles = async (files: FileList) => {
    const newClips: VideoClip[] = [];
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      registerObjectUrl(url);
      if (file.type.startsWith('video/')) {
        const meta = await extractVideoMetadataAndThumbs(url);
        newClips.push({
          id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'video',
          name: file.name.replace(/\.[^.]+$/, ''),
          sourceStart: 0,
          duration: Math.max(1, meta.duration),
          maxDuration: Math.max(1, meta.duration),
          speed: 1,
          volume: 100,
          srcUrl: url,
          thumbnails: meta.thumbnails,
        });
      } else if (file.type.startsWith('image/')) {
        newClips.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'image',
          name: file.name.replace(/\.[^.]+$/, ''),
          sourceStart: 0,
          duration: 4,
          maxDuration: 30,
          speed: 1,
          volume: 0,
          srcUrl: url,
          thumbnails: [url, url, url, url],
        });
      }
    }

    if (newClips.length > 0) {
      commit((prev) => ({ ...prev, clips: [...prev.clips, ...newClips] }));
      showToast(`تمت إضافة ${newClips.length === 1 ? 'مقطع جديد' : `${newClips.length} مقاطع`}`);
    }
  };

  const handleAddDemoClip = (variant: 'worldmap' | 'radar' | 'horizon') => {
    const labels = {
      worldmap: 'خريطة العالم الرقمية',
      radar: 'مسح الرادار التقني',
      horizon: 'أفق ليلي سينمائي',
    };
    const thumbs = generateDemoThumbnails(variant, 5, 6);
    commit((prev) => ({
      ...prev,
      clips: [
        ...prev.clips,
        {
          id: `demo-${Date.now()}`,
          type: 'demo',
          name: labels[variant],
          sourceStart: 0,
          duration: 5,
          maxDuration: 15,
          speed: 1,
          volume: 100,
          demoVariant: variant,
          thumbnails: thumbs,
        },
      ],
    }));
    showToast(`تمت إضافة: ${labels[variant]}`);
  };

  const handleTrimClip = (clipId: string, edge: 'left' | 'right', deltaSeconds: number) => {
    setProject((prev) => ({
      ...prev,
      clips: trimClipEdge(prev.clips, clipId, edge, deltaSeconds),
    }));
  };

  const handleDuplicateClip = () => {
    if (!selectedClipId) return;
    const { clips: nextClips, newSelectedId } = duplicateClipById(project.clips, selectedClipId);
    if (!newSelectedId) return;
    commit((prev) => ({ ...prev, clips: nextClips }));
    setSelectedClipId(newSelectedId);
    showToast('تم تكرار المقطع');
  };

  const handleFreezeFrame = () => {
    setIsPlaying(false);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderCompositeFrame(ctx, 640, 360, project, currentTime, mediaCacheRef.current);
    const frameUrl = canvas.toDataURL('image/jpeg', 0.85);
    const res = insertFreezeFrameAtTime(project.clips, currentTime, frameUrl);
    if (res.error) {
      showToast(res.error);
      return;
    }
    commit((prev) => ({ ...prev, clips: res.clips }));
    setSelectedClipId(res.newSelectedId);
    showToast('تم إدراج إطار مجمّد (2.5 ثانية)');
  };

  const handleReorderClip = (direction: -1 | 1) => {
    if (!selectedClipId) return;
    commit((prev) => ({
      ...prev,
      clips: reorderClip(prev.clips, selectedClipId, direction),
    }));
    showToast(direction === -1 ? 'تم تقديم المقطع' : 'تم تأخير المقطع');
  };

  const handleExportProjectJson = () => {
    const json = serializeProjectJson(project, exportSettings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWSCap-project-${new Date().toISOString().slice(0, 10)}.rwscap.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('تم تنزيل ملف المشروع (.rwscap.json)');
  };

  const handleImportProjectJson = (raw: string) => {
    const { data, error } = deserializeProjectJson(raw);
    if (error || !data) {
      showToast(error || 'تعذر قراءة ملف المشروع');
      return;
    }
    const hydratedClips = data.project.clips.map((c) =>
      c.type === 'demo' && c.thumbnails.length === 0
        ? { ...c, thumbnails: generateDemoThumbnails(c.demoVariant || 'worldmap', c.duration, 8) }
        : c,
    );
    setIsPlaying(false);
    setCurrentTime(0);
    setSelectedClipId(null);
    setTransitionClipId(null);
    setSelectedLayerId(null);
    setActiveTool(null);
    commit(() => ({ ...data.project, clips: hydratedClips }));
    setExportSettings(data.exportSettings);
    showToast('تم استيراد المشروع بنجاح');
  };

  const selectedClipIndex = project.clips.findIndex((c) => c.id === selectedClipId);
  const selectedClip = selectedClipIndex >= 0 ? project.clips[selectedClipIndex] : null;
  const transitionClipIndex = project.clips.findIndex((c) => c.id === transitionClipId);
  const transitionClip = transitionClipIndex >= 0 ? project.clips[transitionClipIndex] : null;

  const hasAdjustments = Object.values(project.adjustments).some((v) => v !== 0);
  const hasFilter = project.filter.id !== 'original';
  const hasBackground = project.background.mode !== 'none';

  return (
    <div className="w-full h-dvh bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
      {/* Mobile-proportioned CapCut Editor Shell (full-bleed on phones, sleek centered frame on desktop) */}
      <main className="relative w-full sm:max-w-[430px] h-dvh bg-[#141414] flex flex-col overflow-hidden sm:border-x sm:border-[#242424] sm:shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        {/* 1. Top Header Bar */}
        <TopBar
          exportSettings={exportSettings}
          onChangeExportSettings={setExportSettings}
          totalDuration={totalDuration}
          onExportClick={() => {
            setIsPlaying(false);
            setShowExport(true);
          }}
          onSearchClick={() => setShowSearch(true)}
          onCloseClick={() => setShowProjectMenu(true)}
        />

        {/* 2. Live Video Preview Canvas */}
        <PreviewStage
          state={project}
          currentTime={currentTime}
          totalDuration={totalDuration}
          isPlaying={isPlaying}
          fullscreen={fullscreen}
          onExitFullscreen={() => setFullscreen(false)}
          onTogglePlay={handleTogglePlay}
          onSeek={(t) => {
            setIsPlaying(false);
            setCurrentTime(t);
          }}
          mediaCache={mediaCacheRef.current}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onMoveText={(id, x, y) =>
            setProject((prev) => ({
              ...prev,
              textItems: prev.textItems.map((t) => (t.id === id ? { ...t, x, y } : t)),
            }))
          }
          onMoveSticker={(id, x, y) =>
            setProject((prev) => ({
              ...prev,
              stickers: prev.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)),
            }))
          }
          onDeleteText={(id) => {
            commit((prev) => ({
              ...prev,
              textItems: prev.textItems.filter((t) => t.id !== id),
            }));
            setSelectedLayerId(null);
          }}
          onDeleteSticker={(id) => {
            commit((prev) => ({
              ...prev,
              stickers: prev.stickers.filter((s) => s.id !== id),
            }));
            setSelectedLayerId(null);
          }}
        />

        {/* Subtle Floating Toast Feedback */}
        {toast && (
          <div
            dir="rtl"
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute top-[62px] left-1/2 -translate-x-1/2 z-[60] px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15 text-[12px] text-white font-medium shadow-lg whitespace-nowrap"
          >
            {toast}
          </div>
        )}

        {/* 3. Playback & History Transport Bar */}
        <TransportBar
          isPlaying={isPlaying}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          syncEnabled={syncEnabled}
          onTogglePlay={handleTogglePlay}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onToggleSync={() => {
            setSyncEnabled((v) => {
              const next = !v;
              showToast(next ? 'تم تفعيل ربط المسارات (ON)' : 'تم إيقاف ربط المسارات (OFF)');
              return next;
            });
          }}
          onFullscreen={() => setFullscreen(true)}
        />

        {/* 4. Interactive CapCut Timeline */}
        <Timeline
          state={project}
          currentTime={currentTime}
          totalDuration={totalDuration}
          isPlaying={isPlaying}
          selectedClipId={selectedClipId}
          selectedLayerId={selectedLayerId}
          coverPreviewUrl={coverPreviewUrl}
          onSeek={(t) => setCurrentTime(t)}
          onScrubStart={() => setIsPlaying(false)}
          onSelectClip={(id) => {
            setSelectedClipId(id);
            if (
              !id &&
              (activeTool === 'speed' ||
                activeTool === 'volume' ||
                activeTool === 'transform' ||
                activeTool === 'animation')
            ) {
              setActiveTool(null);
            }
          }}
          onSelectLayer={setSelectedLayerId}
          onTrimClip={handleTrimClip}
          onOpenTransition={(clipId) => {
            setIsPlaying(false);
            setTransitionClipId(clipId);
            setActiveTool('transition');
          }}
          onToggleMuteMain={() => {
            commit((prev) => ({ ...prev, mutedMain: !prev.mutedMain }));
            showToast(project.mutedMain ? 'تم تشغيل صوت المقطع' : 'تم كتم صوت المقطع');
          }}
          onOpenCover={() => {
            setIsPlaying(false);
            setShowCover(true);
          }}
          onAddMediaClick={() => {
            setIsPlaying(false);
            setShowMediaAdd(true);
          }}
          onOpenAudio={() => {
            setIsPlaying(false);
            setActiveTool('audio');
          }}
          onOpenText={() => {
            setIsPlaying(false);
            setActiveTool('text');
          }}
          onDeleteAudio={(id) =>
            commit((prev) => ({
              ...prev,
              audioClips: prev.audioClips.filter((a) => a.id !== id),
            }))
          }
          onDeleteOverlay={(id) =>
            commit((prev) => ({
              ...prev,
              overlays: prev.overlays.filter((o) => o.id !== id),
            }))
          }
        />

        {/* 5. Bottom Scrollable CapCut Tool Bar */}
        <BottomToolbar
          activeTool={activeTool}
          selectedClipId={selectedClipId}
          hasFilter={hasFilter}
          hasAdjustments={hasAdjustments}
          hasBackground={hasBackground}
          canMoveClipLeft={selectedClipIndex > 0}
          canMoveClipRight={selectedClipIndex >= 0 && selectedClipIndex < project.clips.length - 1}
          onSelectTool={(tool) => {
            if (tool === 'edit') {
              const active = getActiveClipAtTime(project.clips, currentTime);
              if (active) setSelectedClipId(active.clip.id);
              setActiveTool(null);
              return;
            }
            if ((tool === 'transform' || tool === 'animation') && !selectedClipId) {
              const active = getActiveClipAtTime(project.clips, currentTime);
              if (active) setSelectedClipId(active.clip.id);
            }
            setActiveTool(tool);
          }}
          onDeselectClip={() => {
            setSelectedClipId(null);
            setActiveTool(null);
          }}
          onSplitClip={handleSplitSelectedClip}
          onDuplicateClip={handleDuplicateClip}
          onDeleteClip={handleDeleteClip}
          onFreezeFrame={handleFreezeFrame}
          onReorderClip={handleReorderClip}
        />

        {/* ===== ACTIVE BOTTOM TOOL SHEETS ===== */}
        {activeTool === 'adjust' && (
          <AdjustPanel
            adjustments={project.adjustments}
            onChange={(adjustments) => commit((prev) => ({ ...prev, adjustments }), true)}
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'filters' && (
          <FilterPanel
            filter={project.filter}
            onChange={(filter) => commit((prev) => ({ ...prev, filter }), true)}
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'aspect' && (
          <AspectPanel
            aspectRatio={project.aspectRatio}
            onChange={(aspectRatio) => commit((prev) => ({ ...prev, aspectRatio }))}
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'background' && (
          <BackgroundPanel
            background={project.background}
            onChange={(background) => commit((prev) => ({ ...prev, background }))}
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'stickers' && (
          <StickersPanel
            currentTime={currentTime}
            totalDuration={totalDuration}
            stickers={project.stickers}
            onAddSticker={(item) => {
              commit((prev) => ({ ...prev, stickers: [...prev.stickers, item] }));
              setSelectedLayerId(item.id);
              showToast('تمت إضافة الملصق');
            }}
            onDeleteSticker={(id) =>
              commit((prev) => ({
                ...prev,
                stickers: prev.stickers.filter((s) => s.id !== id),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'text' && (
          <TextPanel
            currentTime={currentTime}
            totalDuration={totalDuration}
            textItems={project.textItems}
            onAddText={(item) => {
              commit((prev) => ({ ...prev, textItems: [...prev.textItems, item] }));
              setSelectedLayerId(item.id);
              showToast('تمت إضافة النص');
            }}
            onUpdateText={(id, patch) => {
              commit((prev) => ({
                ...prev,
                textItems: prev.textItems.map((t) => (t.id === id ? { ...t, ...patch } : t)),
              }));
              showToast('تم تحديث النص');
            }}
            onDeleteText={(id) =>
              commit((prev) => ({
                ...prev,
                textItems: prev.textItems.filter((t) => t.id !== id),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'captions' && (
          <CaptionsPanel
            currentTime={currentTime}
            totalDuration={totalDuration}
            captions={project.textItems.filter((t) => t.isCaption)}
            onAddCaption={(item) => {
              commit((prev) => ({ ...prev, textItems: [...prev.textItems, item] }));
              showToast('تمت إضافة الشرح');
            }}
            onDeleteCaption={(id) =>
              commit((prev) => ({
                ...prev,
                textItems: prev.textItems.filter((t) => t.id !== id),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'audio' && (
          <AudioPanel
            currentTime={currentTime}
            totalDuration={totalDuration}
            audioClips={project.audioClips}
            onAddAudio={(clip) => {
              if (clip.srcUrl) registerObjectUrl(clip.srcUrl);
              commit((prev) => ({ ...prev, audioClips: [...prev.audioClips, clip] }));
              showToast('تمت إضافة الصوت إلى المسار');
            }}
            onUpdateAudio={(id, patch) =>
              commit(
                (prev) => ({
                  ...prev,
                  audioClips: prev.audioClips.map((a) => (a.id === id ? { ...a, ...patch } : a)),
                }),
                true,
              )
            }
            onDeleteAudio={(id) =>
              commit((prev) => ({
                ...prev,
                audioClips: prev.audioClips.filter((a) => a.id !== id),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'overlay' && (
          <OverlayPanel
            currentTime={currentTime}
            totalDuration={totalDuration}
            overlays={project.overlays}
            onAddOverlay={(item) => {
              if (item.srcUrl) registerObjectUrl(item.srcUrl);
              commit((prev) => ({ ...prev, overlays: [...prev.overlays, item] }));
              showToast('تمت إضافة التراكب');
            }}
            onUpdateOverlayOpacity={(id, opacity) =>
              setProject((prev) => ({
                ...prev,
                overlays: prev.overlays.map((o) => (o.id === id ? { ...o, opacity } : o)),
              }))
            }
            onDeleteOverlay={(id) =>
              commit((prev) => ({
                ...prev,
                overlays: prev.overlays.filter((o) => o.id !== id),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'speed' && selectedClip && (
          <SpeedPanel
            clip={selectedClip}
            onChangeSpeed={(speed) =>
              commit((prev) => ({
                ...prev,
                clips: changeClipSpeed(prev.clips, selectedClip.id, speed),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'volume' && selectedClip && (
          <VolumePanel
            clip={selectedClip}
            onChangeVolume={(volume) =>
              commit((prev) => ({
                ...prev,
                clips: prev.clips.map((c) =>
                  c.id === selectedClip.id ? { ...c, volume } : c,
                ),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'transform' && selectedClip && (
          <TransformPanel
            clip={selectedClip}
            onChangeTransform={(patch: Partial<ClipTransform>) =>
              commit(
                (prev) => ({
                  ...prev,
                  clips: setClipTransform(prev.clips, selectedClip.id, patch),
                }),
                true,
              )
            }
            onResetTransform={() =>
              commit((prev) => ({
                ...prev,
                clips: setClipTransform(prev.clips, selectedClip.id, DEFAULT_CLIP_TRANSFORM),
              }))
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'animation' && selectedClip && (
          <AnimationPanel
            clip={selectedClip}
            onChangeAnimation={(animation: ClipAnimation) =>
              commit(
                (prev) => ({
                  ...prev,
                  clips: setClipAnimation(prev.clips, selectedClip.id, animation),
                }),
                true,
              )
            }
            onClose={() => setActiveTool(null)}
          />
        )}

        {activeTool === 'transition' && transitionClip && (
          <TransitionPanel
            clip={transitionClip}
            clipIndex={transitionClipIndex}
            hasMultipleJunctions={project.clips.length > 2}
            onChangeTransition={(transition: ClipTransition) =>
              commit((prev) => ({
                ...prev,
                clips: setClipTransition(prev.clips, transitionClip.id, transition),
              }))
            }
            onApplyAll={(transition: ClipTransition) => {
              commit((prev) => ({
                ...prev,
                clips: prev.clips.map((c, idx) =>
                  idx < prev.clips.length - 1 ? { ...c, transitionOut: { ...transition } } : c,
                ),
              }));
              showToast('تم تطبيق الانتقال على جميع المقاطع');
            }}
            onClose={() => {
              setActiveTool(null);
              setTransitionClipId(null);
            }}
          />
        )}

        {/* ===== MODALS ===== */}
        {showExport && (
          <ExportModal
            state={project}
            settings={exportSettings}
            mediaCache={mediaCacheRef.current}
            onClose={() => setShowExport(false)}
          />
        )}

        {showCover && (
          <CoverModal
            state={project}
            totalDuration={totalDuration}
            mediaCache={mediaCacheRef.current}
            onSaveCover={(coverTime, customCoverUrl) => {
              commit((prev) => ({ ...prev, coverTime, customCoverUrl }));
              showToast('تم تحديث الغلاف');
            }}
            onClose={() => setShowCover(false)}
          />
        )}

        {showSearch && (
          <SearchModal
            onSelectTool={(t) => {
              if ((t === 'transform' || t === 'animation') && !selectedClipId) {
                const active = getActiveClipAtTime(project.clips, currentTime);
                if (active) setSelectedClipId(active.clip.id);
              }
              setActiveTool(t);
            }}
            onAddMedia={() => setShowMediaAdd(true)}
            onExport={() => setShowExport(true)}
            onClose={() => setShowSearch(false)}
          />
        )}

        {showMediaAdd && (
          <MediaAddModal
            onImportFiles={handleImportFiles}
            onAddDemoClip={handleAddDemoClip}
            onClose={() => setShowMediaAdd(false)}
          />
        )}

        {showProjectMenu && (
          <ProjectModal
            lastSavedAt={lastSavedAt}
            onSaveDraft={() => {
              if (saveProjectToLocalStorage(project, exportSettings)) {
                setLastSavedAt(
                  new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                );
                showToast('تم حفظ المشروع بالكامل في المتصفح');
              } else {
                showToast('تعذر الحفظ (مساحة التخزين ممتلئة)');
              }
            }}
            onExportProjectJson={handleExportProjectJson}
            onImportProjectJson={handleImportProjectJson}
            onResetProject={() => {
              revokeAllObjectUrls();
              clearProjectLocalStorage();
              setIsPlaying(false);
              setCurrentTime(0);
              setSelectedClipId(null);
              setTransitionClipId(null);
              setSelectedLayerId(null);
              setActiveTool(null);
              setPast([]);
              setFuture([]);
              setLastSavedAt(null);
              setProject(createInitialProject());
              setExportSettings(DEFAULT_EXPORT_SETTINGS);
              showToast('تمت إعادة تعيين المشروع');
            }}
            onAddMedia={() => setShowMediaAdd(true)}
            onClose={() => setShowProjectMenu(false)}
          />
        )}
      </main>
    </div>
  );
}
