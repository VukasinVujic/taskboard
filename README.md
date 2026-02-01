# Taskboard

Taskboard is a learning-focused Angular app that demonstrates state management, RxJS streams, and user-friendly UX patterns.

## Features

- Full CRUD for tasks
- Search with debounce and UX rules
- Undo delete with countdown toast
- Optimistic UI updates
- LocalStorage persistence
- OnPush change detection everywhere

## Architecture

- Components – pure UI, no business logic, OnPush onlyf
- Store (TaskStoreService) – single source of truth
- ViewModel streams – components consume Observables, never state directly
- Persistence layer – LocalStorage for tasks and UI preferences

## High-level data flow

- UI Event → Subject → RxJS pipeline → State update → VM$ → Template
- Components are reactive views, not controllers
- All state changes go through a single entry point
- No imperative subscriptions inside components

## RxJS Highlights

- This project is intentionally RxJS-heavy. The goal is clarity, predictability, and control over side effects.
- Used patterns and operators:
- BehaviorSubject – centralized state container
- scan – incremental state accumulation (Redux-like, but lightweight)
- switchMap – async workflows (search, fake API calls)
- shareReplay(1) – cache latest values and avoid duplicate subscriptions
- combineLatest – ViewModel composition
- filter / map / tap – pure transformations and side effects

## Mental model

- No business logic inside components
- Components only listen to $ streams
- Every async interaction is modeled as a stream

## State & UX Rules

- These rules are explicitly enforced in the store:

### Search

- Empty or short search term → return all tasks
- Loading indicator appears only during real async calls

### Undo

- Deleting a task triggers a toast with countdown
- Undo restores the last deleted task

### Optimistic updates

- UI updates immediately
- Backend synchronization (fake API) happens afterward

## Getting Started

    npm install

    ng serve

    Angular: 20.1.0,

    Development server runs on:

    http://localhost:4200

## Roadmap

.

## Why this project exists

Taskboard is not "just another todo app".
Its purpose is to:
Demonstrate real-world RxJS usage
Build a strong mental model for state management without over-engineering
Serve as an interview-ready Angular reference project
If you understand this codebase, you understand how to structure serious Angular applications.
