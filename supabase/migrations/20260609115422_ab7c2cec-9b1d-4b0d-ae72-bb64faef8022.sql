ALTER TABLE public.alongamento_logs ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.alongamento_logs ADD COLUMN IF NOT EXISTS sincronizado_em TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_alongamento_logs_data ON public.alongamento_logs(data DESC);