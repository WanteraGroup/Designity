import { ForgedButton, NordicHeader } from '@/components/ui';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Type,
  Palette,
  Layout,
  Download,
  Undo2,
  Redo2,
  Mic,
  Send,
  Check,
  FileText,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { supabase } from '@/lib/supabase';
import {
  runDesignlyGroqEditor,
  type DesignEditorState,
  type DesignEditorChange,
} from '@/lib/designly-editor-ai';

interface EditorPageProps {
  onNavigate: (page: string) => void;
}

const QUICK_COMMANDS = [
  'Make it more luxurious',
  'Use silver instead of gold',
  'Make the typography stronger',
  'Make the mobile version cleaner',
  'Add a subtle Celtic border',
  'Add a soft mist atmosphere',
  'Align the hero to the left',
  'Use a four-column gallery',
];

function initialDesign(previewTitle: string, previewDescription: string): DesignEditorState {
  return {
    heroTitle: previewTitle || 'DESIGNLY STUDIO',
    heroDescription:
      previewDescription || 'Create premium websites, brands and campaigns with AI.',
    heroButton: 'GET STARTED',
    accent: '#D6AA4A',
    surface: '#111318',
    text: '#F5F0E6',
    heroAlign: 'center',
    galleryColumns: 3,
    celticBorder: false,
    atmosphere: 'glow',
  };
}

function clampHistory<T>(items: T[], limit = 30) {
  return items.length > limit ? items.slice(items.length - limit) : items;
}

export function EditorPageBootstrap() {
  return null;
}
