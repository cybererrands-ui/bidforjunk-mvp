-- Migration 003: Enable Supabase Realtime on the messages table
-- This is required for real-time chat subscriptions to work.
-- Run this in Supabase SQL Editor.

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
