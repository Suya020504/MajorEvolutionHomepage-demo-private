"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 오시는 길 — 카카오맵 지도 카드 (거점 토글).
 * - 좌표는 카카오 로컬 POI 공식 값 하드코딩 (지오코딩 의존 없음).
 * - NEXT_PUBLIC_KAKAO_MAPS_APP_KEY 없거나 로드 실패 시 길찾기 링크만 표시.
 * - Kakao Developers [플랫폼 → Web]에 사이트 도메인 등록 필요.
 */

type Location = {
  key: string;
  chip: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const LOCATIONS: Location[] = [
  {
    key: "manufacture",
    chip: "제조 · 원더플라스틱",
    name: "원더플라스틱",
    address: "울산광역시 남구 정광로 8",
    // 카카오 로컬 POI 공식 좌표 (무거동 1252-6)
    lat: 35.5471421,
    lng: 129.2827077,
  },
  {
    key: "startup",
    chip: "창업지원 · 진주",
    name: "진주창업지원센터",
    address: "경상남도 진주시 대신로244번길 8",
    // 카카오 로컬 POI 공식 좌표 (상대동 315-7)
    lat: 35.1820041,
    lng: 128.1186525,
  },
];

const kakaoMapUrl = (l: Location) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(l.name)},${l.lat},${l.lng}`;

function loadKakaoMaps(key: string): Promise<any> {
  const w = window as any;
  if (w.kakao?.maps?.Map) return Promise.resolve(w.kakao);
  if (w.__moduKakaoPromise) return w.__moduKakaoPromise;
  w.__moduKakaoPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      key
    )}&autoload=false`;
    s.async = true;
    s.onload = () => {
      try {
        w.kakao.maps.load(() => resolve(w.kakao));
      } catch {
        reject(new Error("kakao maps load failed"));
      }
    };
    s.onerror = () => reject(new Error("kakao script failed"));
    document.head.appendChild(s);
  });
  return w.__moduKakaoPromise;
}

const labelHtml = (name: string) =>
  '<div style="padding:4px 10px;background:#fff;border:1px solid rgba(11,11,12,.15);border-radius:9999px;font-size:12px;font-weight:700;color:#0b0b0c;box-shadow:0 4px 14px rgba(11,11,12,.12);white-space:nowrap">' +
  name +
  "</div>";

export function LocationMap({ track }: { track?: string }) {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;
  const boxRef = useRef<HTMLDivElement>(null);
  const kitRef = useRef<any>(null); // { kakao, map, marker, overlay }
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  // 문의 폼의 트랙 선택과 동기화 — 제조는 원더플라스틱, 그 외(개발·미정)는 진주
  useEffect(() => {
    if (!track) return;
    setActive(track === "manufacture" ? 0 : 1);
  }, [track]);

  const loc = LOCATIONS[active];

  // 최초 로드
  useEffect(() => {
    if (!key || !boxRef.current) return;
    let cancelled = false;

    loadKakaoMaps(key)
      .then((kakao) => {
        if (cancelled || !boxRef.current) return;
        const first = LOCATIONS[0];
        const center = new kakao.maps.LatLng(first.lat, first.lng);
        const map = new kakao.maps.Map(boxRef.current, { center, level: 3 });
        map.addControl(
          new kakao.maps.ZoomControl(),
          kakao.maps.ControlPosition.RIGHT
        );
        const marker = new kakao.maps.Marker({ map, position: center });
        const overlay = new kakao.maps.CustomOverlay({
          map,
          position: center,
          yAnchor: 2.6,
          content: labelHtml(first.name),
        });
        kitRef.current = { kakao, map, marker, overlay };
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [key]);

  // 거점 전환
  useEffect(() => {
    const kit = kitRef.current;
    if (!kit) return;
    const pos = new kit.kakao.maps.LatLng(loc.lat, loc.lng);
    kit.map.setCenter(pos);
    kit.marker.setPosition(pos);
    kit.overlay.setPosition(pos);
    kit.overlay.setContent(labelHtml(loc.name));
  }, [loc]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-secondary/40">
      <div className="p-7 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="kicker text-muted-foreground">오시는 길</p>
            <p className="mt-1.5 text-base font-medium text-foreground">
              {loc.name}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{loc.address}</p>
          </div>
          <a
            href={kakaoMapUrl(loc)}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand"
          >
            길찾기
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>

        <div className="mt-4 flex gap-2">
          {LOCATIONS.map((l, i) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                i === active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {l.chip}
            </button>
          ))}
        </div>
      </div>

      {key && !failed ? (
        <div
          ref={boxRef}
          className="h-72 w-full bg-secondary"
          aria-label={`${loc.name} 지도`}
        />
      ) : (
        <div className="flex h-40 items-center justify-center px-7 text-center text-sm text-muted-foreground">
          {failed
            ? "지도를 불러오지 못했습니다. 위의 길찾기 링크를 이용해 주세요."
            : "지도 API 키가 설정되면 이곳에 지도가 표시됩니다."}
        </div>
      )}
    </div>
  );
}
