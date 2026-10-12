"use client";
import { useSyncExternalStore } from "react";
import { compressionStore } from "@/stores/compression-store";
export function useCompressionStore() { return useSyncExternalStore(compressionStore.subscribe, compressionStore.getSnapshot, compressionStore.getSnapshot); }
