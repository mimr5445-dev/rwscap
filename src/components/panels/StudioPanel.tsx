import React, { useMemo, useRef, useState } from 'react';
import { CarModelId, PersonModelId, SceneActor } from '../../types/editor';
import { getVaultActorPreviewUrl } from '../../utils/actorRenderer';
import {
  buildActionTimelineLog,
  CAR_VAULT,
  PERSON_VAULT,
} from '../../utils/sceneActors';
import { formatTimecode } from '../../utils/time';
import { ToolSheet } from './ToolSheet';

interface StudioPanelProps {
  actors: SceneActor[];
  selectedActorId: string | null;
  currentTime: number;
  totalDuration: number;
  isRecordingMotion: boolean;
  onSelectActor: (id: string | null) => void;
  onSpawnCar: (modelId: CarModelId) => void;
  onSpawnPerson: (modelId: PersonModelId) => void;
  onUpdateActor: (id: string, patch: Partial<SceneActor>) => void;
  onClearActorPath: (id: string) => void;
  onDeleteActor: (id: string) => void;
  onToggleRecordMotion: () => void;
  onJumpToTime: (time: number) => void;
  onUseDesertStationBackdrop: () => void;
  onUploadSceneImage: (file: File) => void;
  onExtendDuration: (extraSec: number) => void;
  onClose: () => void;
}

type StudioTab = 'cars' | 'people' | 'scene';

export const StudioPanel: React.FC<StudioPanelProps> = ({
  actors,
  selectedActorId,
  currentTime,
  totalDuration,
  isRecordingMotion,
  onSelectActor,
  onSpawnCar,
  onSpawnPerson,
  onUpdateActor,
  onClearActorPath,
  onDeleteActor,
  onToggleRecordMotion,
  onJumpToTime,
  onUseDesertStationBackdrop,
  onUploadSceneImage,
  onExtendDuration,
  onClose,
}) => {
  const [tab, setTab] = useState<StudioTab>('cars');
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const selectedActor = actors.find((a) => a.id === selectedActorId) || null;
  const actionLog = useMemo(() => buildActionTimelineLog(actors), [actors]);

  return (
    <ToolSheet title="استوديو المشهد · خزنة السيارات والأشخاص" onClose={onClose}>
      <input
        ref={backdropInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUploadSceneImage(f);
          e.target.value = '';
        }}
      />

      {/* Mode Tabs */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 bg-[#141517] p-1 rounded-xl">
        {(
          [
            ['cars', `خزنة السيارات (${CAR_VAULT.length})`],
            ['people', `خزنة الأشخاص (${PERSON_VAULT.length})`],
            ['scene', `المشهد والسجل (${actionLog.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`py-1.5 px-2 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
              tab === id
                ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                : 'text-[#BDBDBD] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interactive Tip & Live Record Toggle */}
      <div className="flex items-center justify-between gap-2 mb-3 px-2.5 py-2 rounded-xl bg-[#24272B] border border-white/5">
        <p className="text-[11px] text-[#CFCFCF] leading-snug">
          {selectedActor
            ? `المحدد: «${selectedActor.name}» — المس الصورة لتوجيهه أو اسحبه لتسجيل المسار.`
            : 'أضف سيارة أو شخصاً من الخزنة ثم المس الصورة لتحديد وجهته بالوقت.'}
        </p>
        <button
          type="button"
          onClick={onToggleRecordMotion}
          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            isRecordingMotion
              ? 'bg-[#E53945] text-white'
              : 'bg-[#32363C] text-[#EAEAEA] hover:bg-[#3D4249]'
          }`}
        >
          {isRecordingMotion ? '● إيقاف التسجيل' : '● تسجيل بالمس'}
        </button>
      </div>

      {/* TAB 1: CARS VAULT */}
      {tab === 'cars' && (
        <div className="grid grid-cols-3 gap-2">
          {CAR_VAULT.map((car) => {
            const thumb = getVaultActorPreviewUrl('car', car.modelId);
            return (
              <button
                key={car.modelId}
                type="button"
                onClick={() => onSpawnCar(car.modelId)}
                className="group flex flex-col items-center p-2 rounded-xl bg-[#26282C] hover:bg-[#30343A] border border-white/5 hover:border-[#00CAE0]/60 active:scale-95 transition cursor-pointer"
              >
                <div className="w-full h-[54px] flex items-center justify-center overflow-hidden rounded-lg bg-[#1D1F22]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={car.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="w-8 h-4 rounded"
                      style={{ backgroundColor: car.primaryColor }}
                    />
                  )}
                </div>
                <span className="text-[11.5px] font-medium text-[#EFEFEF] mt-1.5 truncate max-w-full">
                  {car.name}
                </span>
                <span className="text-[10px] text-[#8E8E8E]">{car.subtitle}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: PEOPLE VAULT */}
      {tab === 'people' && (
        <div className="grid grid-cols-3 gap-2">
          {PERSON_VAULT.map((person) => {
            const thumb = getVaultActorPreviewUrl('person', person.modelId);
            return (
              <button
                key={person.modelId}
                type="button"
                onClick={() => onSpawnPerson(person.modelId)}
                className="group flex flex-col items-center p-2 rounded-xl bg-[#26282C] hover:bg-[#30343A] border border-white/5 hover:border-[#00CAE0]/60 active:scale-95 transition cursor-pointer"
              >
                <div className="w-full h-[54px] flex items-center justify-center overflow-hidden rounded-lg bg-[#1D1F22]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={person.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="w-5 h-7 rounded-full"
                      style={{ backgroundColor: person.primaryColor }}
                    />
                  )}
                </div>
                <span className="text-[11.5px] font-medium text-[#EFEFEF] mt-1.5 truncate max-w-full">
                  {person.name}
                </span>
                <span className="text-[10px] text-[#8E8E8E]">{person.subtitle}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 3: SCENE ACTORS, SETTINGS & RECORDED ACTIONS LOG */}
      {tab === 'scene' && (
        <div className="space-y-3">
          {/* Scene Backdrop & Duration Controls */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onUseDesertStationBackdrop}
              className="py-2 px-2 rounded-xl bg-[#26292E] hover:bg-[#31353B] text-[11px] text-[#00CAE0] font-medium cursor-pointer"
            >
              محطة الصحراء
            </button>
            <button
              type="button"
              onClick={() => backdropInputRef.current?.click()}
              className="py-2 px-2 rounded-xl bg-[#26292E] hover:bg-[#31353B] text-[11px] text-[#EAEAEA] font-medium cursor-pointer"
            >
              تغيير الصورة
            </button>
            <button
              type="button"
              onClick={() => onExtendDuration(5)}
              className="py-2 px-2 rounded-xl bg-[#26292E] hover:bg-[#31353B] text-[11px] text-[#EAEAEA] font-medium tabular-nums cursor-pointer"
            >
              +5ث ({Math.round(totalDuration)}s)
            </button>
          </div>

          {/* Active Actors in Scene */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-[#8E8E8E]">
              العناصر داخل المشهد ({actors.length}) — الوقت الحالي {formatTimecode(currentTime)}:
            </div>
            {actors.length === 0 ? (
              <p className="text-[12px] text-[#7D7D7D] py-3 text-center bg-[#232529] rounded-xl">
                لا توجد سيارات أو أشخاص بعد. أضفهم من الخزنة!
              </p>
            ) : (
              actors.map((actor) => {
                const isSel = actor.id === selectedActorId;
                return (
                  <div
                    key={actor.id}
                    onClick={() => onSelectActor(actor.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSel
                        ? 'bg-[#17363D]/80 border-[#00CAE0]'
                        : 'bg-[#25272B] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: actor.primaryColor }}
                        />
                        <span className="text-[12.5px] font-medium text-white truncate">
                          {actor.name}
                        </span>
                        <span className="text-[10.5px] text-[#9AC9D1] tabular-nums shrink-0">
                          ({actor.keyframes.length} نقاط)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearActorPath(actor.id);
                          }}
                          className="text-[10.5px] text-[#FFD447] hover:underline cursor-pointer"
                        >
                          مسح المسار
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteActor(actor.id);
                          }}
                          className="text-[10.5px] text-[#FF7B7B] hover:underline cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>

                    {isSel && (
                      <div
                        className="grid grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="flex flex-col gap-1 text-[10.5px] text-[#C4DDE2]">
                          <span>الحجم {Math.round(actor.scale * 100)}%</span>
                          <input
                            type="range"
                            min={60}
                            max={170}
                            step={5}
                            value={Math.round(actor.scale * 100)}
                            onChange={(e) =>
                              onUpdateActor(actor.id, { scale: Number(e.target.value) / 100 })
                            }
                            className="cap-slider"
                            dir="ltr"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[10.5px] text-[#C4DDE2]">
                          <span>السرعة {Math.round(actor.speed)}</span>
                          <input
                            type="range"
                            min={5}
                            max={35}
                            step={1}
                            value={Math.round(actor.speed)}
                            onChange={(e) =>
                              onUpdateActor(actor.id, { speed: Number(e.target.value) })
                            }
                            className="cap-slider"
                            dir="ltr"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Chronological Recorded Action Log */}
          {actionLog.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[#2C2E32]">
              <div className="text-[11px] text-[#8E8E8E]">
                سجل الإجراءات المسجّلة على الخط الزمني (اضغط للانتقال للوقت):
              </div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto no-scrollbar">
                {actionLog.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      onSelectActor(entry.actorId);
                      onJumpToTime(entry.fromTime);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#23262A] hover:bg-[#2E3238] text-right transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.primaryColor }}
                      />
                      <span className="text-[11.5px] text-[#EFEFEF] truncate">
                        {entry.actorName}: {entry.label}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#00CAE0] tabular-nums shrink-0" dir="ltr">
                      {formatTimecode(entry.fromTime)} → {formatTimecode(entry.toTime)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolSheet>
  );
};
