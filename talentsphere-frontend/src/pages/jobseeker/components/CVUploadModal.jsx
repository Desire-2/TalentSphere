import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  WandSparkles,
  XCircle,
} from 'lucide-react';

import apiService from '../../../services/api';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Progress } from '../../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';

const TOTAL_STEPS = 7;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff'];

const initialState = {
  step: 1,
  file: null,
  extractedText: '',
  extractedMeta: { charCount: 0, pages: 0 },
  parsedProfile: null,
  autofillResult: null,
  loadingMessage: '',
  fillingProgress: 0,
  error: '',
};

const CVUploadModal = ({ open, onOpenChange, onSuccess }) => {
  const fileInputRef = useRef(null);
  const cancelRequestedRef = useRef(false);

  const [state, setState] = useState(initialState);
  const [isDragOver, setIsDragOver] = useState(false);

  const sectionSummary = useMemo(() => {
    const parsed = state.parsedProfile || {};

    const listLength = (value) => (Array.isArray(value) ? value.length : 0);
    const hasPersonal = Boolean(
      parsed.personal_info &&
      Object.values(parsed.personal_info).some((value) => String(value || '').trim())
    );
    const hasSummary = Boolean((parsed.professional_summary?.summary || '').trim());
    const hasPrefs = Boolean(
      parsed.job_preferences &&
      Object.values(parsed.job_preferences).some((value) => String(value || '').trim())
    );
    const skills = parsed.skills || {};
    const hasSkills =
      listLength(skills.technical_skills) +
        listLength(skills.soft_skills) +
        listLength(skills.languages_of_work) >
      0;

    return [
      { key: 'personal_info', label: 'Personal Info', found: hasPersonal, count: hasPersonal ? 1 : 0 },
      { key: 'professional_summary', label: 'Professional Summary', found: hasSummary, count: hasSummary ? 1 : 0 },
      { key: 'job_preferences', label: 'Job Preferences', found: hasPrefs, count: hasPrefs ? 1 : 0 },
      { key: 'work_experience', label: 'Work Experiences', found: listLength(parsed.work_experience) > 0, count: listLength(parsed.work_experience) },
      { key: 'education', label: 'Education Entries', found: listLength(parsed.education) > 0, count: listLength(parsed.education) },
      { key: 'certifications', label: 'Certifications', found: listLength(parsed.certifications) > 0, count: listLength(parsed.certifications) },
      { key: 'skills', label: 'Skills', found: hasSkills, count: hasSkills ? 1 : 0 },
      { key: 'projects', label: 'Projects', found: listLength(parsed.projects) > 0, count: listLength(parsed.projects) },
      { key: 'awards', label: 'Awards', found: listLength(parsed.awards) > 0, count: listLength(parsed.awards) },
      { key: 'languages', label: 'Languages', found: listLength(parsed.languages) > 0, count: listLength(parsed.languages) },
      {
        key: 'volunteer_experience',
        label: 'Volunteer Experiences',
        found: listLength(parsed.volunteer_experience) > 0,
        count: listLength(parsed.volunteer_experience),
      },
      {
        key: 'professional_memberships',
        label: 'Professional Memberships',
        found: listLength(parsed.professional_memberships) > 0,
        count: listLength(parsed.professional_memberships),
      },
    ];
  }, [state.parsedProfile]);

  const resetState = () => {
    cancelRequestedRef.current = false;
    setState(initialState);
    setIsDragOver(false);
  };

  const setError = (message) => {
    setState((prev) => ({
      ...prev,
      step: prev.step > 6 ? prev.step : Math.max(prev.step, 2),
      error: message,
    }));
  };

  const closeModal = () => {
    cancelRequestedRef.current = true;
    onOpenChange(false);
    resetState();
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      closeModal();
      return;
    }
    onOpenChange(nextOpen);
  };

  const validateFile = (file) => {
    if (!file) return 'Please select a file.';

    const extension = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    if (!ACCEPTED_TYPES.includes(extension)) {
      return 'Unsupported file type. Use PDF, PNG, JPG, JPEG, or TIFF.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB. Please upload a smaller CV.';
    }

    return '';
  };

  const handleFileSelected = async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    cancelRequestedRef.current = false;
    setState((prev) => ({
      ...prev,
      file,
      error: '',
      step: 2,
      loadingMessage: 'Reading your CV...',
      extractedText: '',
      parsedProfile: null,
      autofillResult: null,
      fillingProgress: 0,
    }));

    try {
      const response = await apiService.cvExtractText(file);
      if (cancelRequestedRef.current) {
        return;
      }

      const extractedText = response?.extracted_text || '';
      if (!extractedText.trim()) {
        setError('No readable text was found. Try a clearer scan or a text-based PDF.');
        return;
      }

      setState((prev) => ({
        ...prev,
        step: 3,
        extractedText,
        extractedMeta: {
          charCount: response?.char_count || extractedText.length,
          pages: response?.pages || 1,
        },
        loadingMessage: '',
      }));
    } catch (error) {
      if (!cancelRequestedRef.current) {
        setError(error.message || 'Failed to extract CV text. Please try again.');
      }
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      await handleFileSelected(droppedFile);
    }
  };

  const handleParseWithAI = async () => {
    cancelRequestedRef.current = false;
    setState((prev) => ({
      ...prev,
      step: 4,
      loadingMessage: 'AI is analyzing your CV...',
      error: '',
    }));

    try {
      const response = await apiService.cvParseWithAI(state.extractedText);
      if (cancelRequestedRef.current) {
        return;
      }

      const parsedProfile = response?.parsed_profile;
      if (!parsedProfile) {
        setError('Could not parse CV. Please fill manually.');
        return;
      }

      setState((prev) => ({
        ...prev,
        step: 5,
        parsedProfile,
        loadingMessage: '',
      }));
    } catch (error) {
      if (!cancelRequestedRef.current) {
        setError(error.message || 'AI parsing failed. Please try again.');
      }
    }
  };

  const handleAutofillProfile = async () => {
    cancelRequestedRef.current = false;
    setState((prev) => ({
      ...prev,
      step: 6,
      error: '',
      fillingProgress: 10,
      loadingMessage: 'Applying parsed CV data to your profile...',
    }));

    let progressTimer = null;
    try {
      progressTimer = window.setInterval(() => {
        setState((prev) => ({
          ...prev,
          fillingProgress: prev.fillingProgress >= 90 ? 90 : prev.fillingProgress + 10,
        }));
      }, 350);

      const response = await apiService.cvAutoFill(state.parsedProfile);
      if (cancelRequestedRef.current) {
        return;
      }

      if (progressTimer) {
        window.clearInterval(progressTimer);
      }

      setState((prev) => ({
        ...prev,
        step: 7,
        fillingProgress: 100,
        loadingMessage: '',
        autofillResult: response,
      }));
    } catch (error) {
      if (progressTimer) {
        window.clearInterval(progressTimer);
      }
      if (!cancelRequestedRef.current) {
        setError(error.message || 'Auto-fill failed. Please try again.');
      }
    }
  };

  const stepLabel = `Step ${state.step} of ${TOTAL_STEPS}`;

  const renderStepContent = () => {
    if (state.error) {
      return (
        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setState((prev) => ({ ...prev, error: '' }));
              }}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setState(initialState);
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (state.step === 1) {
      return (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
            }`}
          >
            <Upload className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="text-base font-semibold text-slate-900">Drop your CV here or click to upload</p>
            <p className="mt-2 text-sm text-slate-600">Supported: PDF, PNG, JPG, JPEG, TIFF</p>
            <p className="text-xs text-slate-500">Maximum file size: 10MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={async (event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                await handleFileSelected(selected);
              }
              event.target.value = '';
            }}
          />

          <div className="flex justify-end">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (state.step === 2 || state.step === 4) {
      return (
        <div className="space-y-5 py-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-700">{state.loadingMessage}</p>
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      );
    }

    if (state.step === 3) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-slate-700">
              {state.extractedMeta.pages} page{state.extractedMeta.pages === 1 ? '' : 's'}
            </Badge>
            <Badge variant="outline" className="text-slate-700">
              {state.extractedMeta.charCount.toLocaleString()} characters
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <textarea
              readOnly
              value={state.extractedText}
              className="max-h-[300px] min-h-[240px] w-full resize-none overflow-y-auto rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setState(initialState);
              }}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleParseWithAI} className="gap-2">
                Parse with AI
                <WandSparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (state.step === 5) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">AI Extraction Summary</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sectionSummary.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-medium">
                    {item.found ? `✅ ${item.count}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: 3 }))}>
              Back
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleAutofillProfile} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Auto-Fill My Profile
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  This will add new entries to your profile. Existing data will not be deleted.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      );
    }

    if (state.step === 6) {
      return (
        <div className="space-y-5 py-2">
          <div className="flex items-center gap-3 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p>{state.loadingMessage || 'Applying your profile updates...'}</p>
          </div>
          <Progress value={state.fillingProgress} className="h-2" />
          <p className="text-xs text-slate-500">You can cancel at any time.</p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (state.step === 7) {
      const filled = state.autofillResult?.filled_sections || [];
      const skipped = state.autofillResult?.skipped_sections || [];

      return (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              CV auto-fill completed. Your profile has been updated with extracted information.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Filled Sections</p>
              <ul className="mt-2 space-y-1 text-sm text-green-800">
                {filled.length ? filled.map((name) => <li key={name}>• {name}</li>) : <li>• None</li>}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Skipped Sections</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {skipped.length ? skipped.map((name) => <li key={name}>• {name}</li>) : <li>• None</li>}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={async () => {
                if (onSuccess) {
                  await onSuccess();
                }
                closeModal();
              }}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Close & Refresh
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <div className="mb-1 flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-semibold text-slate-900">CV Auto-Fill</DialogTitle>
            <Badge variant="outline" className="text-xs font-medium text-slate-700">
              {stepLabel}
            </Badge>
          </div>
          <DialogDescription>
            Upload your CV, review extracted text, and auto-fill your profile sections using AI.
          </DialogDescription>
        </DialogHeader>

        {state.file && state.step > 1 && state.step < 7 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            File: <span className="font-medium text-slate-800">{state.file.name}</span>
          </div>
        )}

        {renderStepContent()}

        {state.step !== 1 && state.step !== 7 && !state.error && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <XCircle className="h-3.5 w-3.5" />
            Loading actions are cancellable.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CVUploadModal;
