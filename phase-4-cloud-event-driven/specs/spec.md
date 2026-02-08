# Feature Specification: Advanced Cloud Deployment & Event-Driven Architecture (Phase V)

**Feature Branch**: `004-cloud-event-driven`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Transform the Todo Chatbot from a stateless CRUD-based system into a scalable, event-driven, cloud-native microservices architecture with advanced task intelligence. Deployment must support production-grade Kubernetes (AKS / GKE / OKE)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enhanced Task Management (Priority: P1)

As an authenticated user, I want to assign due dates, priorities, tags, and recurring patterns to my tasks so that I can organize my work with richer context and have repetitive tasks managed automatically.

**Why this priority**: Enhanced task attributes are the foundational user-facing value of Phase V. All downstream features (reminders, recurring task generation, filtering) depend on these enriched task properties existing first.

**Independent Test**: Can be fully tested by creating a task with due date, priority, tags, and recurring pattern through the chatbot or API, then verifying all attributes persist and display correctly.

**Acceptance Scenarios**:

1. **Given** I am authenticated, **When** I create a task with a due date (e.g., "add task buy groceries due tomorrow at 5pm"), **Then** the task is created with the correct `due_at` datetime stored and confirmed in the response.
2. **Given** I am authenticated, **When** I create a task with priority (e.g., "add high priority task prepare presentation"), **Then** the task is created with `priority` set to "high" and confirmed.
3. **Given** I am authenticated, **When** I create a task with tags (e.g., "add task buy milk tagged groceries, urgent"), **Then** the task is created with tags `["groceries", "urgent"]` stored and confirmed.
4. **Given** I am authenticated, **When** I create a task with a recurring pattern (e.g., "add daily task morning standup"), **Then** the task is created with `recurring_pattern` set to "daily" and confirmed.
5. **Given** I have tasks with various priorities, **When** I ask "show my high priority tasks", **Then** only tasks with priority "high" are returned.
6. **Given** I have tasks with tags, **When** I ask "show tasks tagged groceries", **Then** only tasks with the "groceries" tag are returned.
7. **Given** I have tasks with due dates, **When** I ask "show tasks due this week", **Then** only tasks with `due_at` within the current week are returned.

---

### User Story 2 - Recurring Task Auto-Generation (Priority: P2)

As an authenticated user, I want the system to automatically create the next occurrence of a recurring task when I complete one so that I never have to manually re-create repetitive tasks.

**Why this priority**: Recurring tasks are the primary automation feature of Phase V. They depend on enhanced task attributes (P1) but deliver significant user value by eliminating repetitive manual task creation.

**Independent Test**: Can be fully tested by creating a daily recurring task, marking it complete, and verifying a new task instance is automatically created with the correct next due date.

**Acceptance Scenarios**:

1. **Given** I have a daily recurring task "morning standup" due today, **When** I mark it complete, **Then** a new task "morning standup" is automatically created with `due_at` set to tomorrow and the same recurring pattern.
2. **Given** I have a weekly recurring task "team sync" due Monday, **When** I mark it complete, **Then** a new instance is created with `due_at` set to next Monday.
3. **Given** I have a monthly recurring task "pay rent" due on the 1st, **When** I mark it complete, **Then** a new instance is created with `due_at` set to the 1st of the next month.
4. **Given** I complete a recurring task, **When** the next occurrence is generated, **Then** the new task retains the original task's priority, tags, and recurring pattern.
5. **Given** I complete a recurring task, **When** I check my task list, **Then** the completed task remains visible as completed and the new occurrence appears as a separate incomplete task.
6. **Given** I complete a recurring task, **When** the new instance is created, **Then** the creation happens asynchronously (my completion response returns immediately, not blocked by the generation process).

---

### User Story 3 - Reminder Notifications (Priority: P3)

As an authenticated user, I want to receive reminders before my tasks are due so that I never miss important deadlines.

**Why this priority**: Reminders make due dates actionable by proactively alerting users. They depend on due dates (P1) and the event infrastructure but are not required for core task management.

**Independent Test**: Can be fully tested by creating a task with a due date 30 minutes from now, waiting, and verifying a reminder notification is delivered at the appropriate time.

**Acceptance Scenarios**:

1. **Given** I create a task due in 1 hour, **When** 30 minutes remain before the due time, **Then** I receive a reminder notification.
2. **Given** I update a task's due date to a new time, **When** the original reminder time passes, **Then** no reminder fires for the old time and a new reminder is scheduled for the updated time.
3. **Given** I complete a task before its due date, **When** the scheduled reminder time arrives, **Then** no reminder is sent.
4. **Given** I delete a task with a pending reminder, **When** the scheduled reminder time arrives, **Then** no reminder is sent.
5. **Given** multiple tasks are due around the same time, **When** their reminder windows arrive, **Then** each task triggers its own independent reminder.

---

### User Story 4 - Real-Time Task Synchronization (Priority: P4)

As an authenticated user with multiple browser tabs or devices open, I want to see task changes reflected in real time so that my view stays current without manual refresh.

**Why this priority**: Real-time sync enhances the user experience for multi-device usage but is not required for core task operations. It depends on the event infrastructure being operational.

**Independent Test**: Can be fully tested by opening two browser tabs, creating a task in one tab, and verifying it appears in the other tab within seconds without manual refresh.

**Acceptance Scenarios**:

1. **Given** I have two browser tabs open, **When** I create a task in tab A, **Then** the new task appears in tab B within 3 seconds without refresh.
2. **Given** I have two browser tabs open, **When** I complete a task in tab A, **Then** the completion status updates in tab B within 3 seconds.
3. **Given** I am connected via WebSocket, **When** the server connection drops, **Then** the client automatically attempts to reconnect.
4. **Given** I am disconnected temporarily, **When** I reconnect, **Then** I receive any task updates that occurred during the disconnection.

---

### User Story 5 - Production Cloud Deployment (Priority: P5)

As a DevOps operator, I want to deploy the entire application stack to a production-grade managed Kubernetes cluster (AKS, GKE, or OKE) using Helm and a CI/CD pipeline so that the application runs reliably at scale with automated deployment.

**Why this priority**: Cloud deployment is the operational backbone of Phase V but requires all application services to be built first. It wraps the system in production infrastructure.

**Independent Test**: Can be fully tested by triggering the CI/CD pipeline, verifying Docker images are built and pushed, Helm chart deploys successfully to the cloud cluster, all pods reach Running status, and the application is accessible via TLS-enabled ingress.

**Acceptance Scenarios**:

1. **Given** code is pushed to the main branch, **When** the CI/CD pipeline runs, **Then** Docker images for all services are built, tagged, and pushed to the container registry.
2. **Given** images are in the registry, **When** the pipeline deploys via Helm, **Then** all Kubernetes resources are created and pods reach Running status within 5 minutes.
3. **Given** the deployment is running, **When** accessing the application via the ingress URL, **Then** the frontend loads over HTTPS with a valid TLS certificate.
4. **Given** the deployment is running, **When** checking health endpoints, **Then** all services report healthy via liveness and readiness probes.
5. **Given** the cluster is under load, **When** CPU/memory thresholds are exceeded, **Then** horizontal pod autoscaler increases replicas for the affected service.
6. **Given** the operator needs to view system health, **When** accessing monitoring dashboards, **Then** centralized logs, pod metrics, and service health are visible without SSH access.

---

### User Story 6 - Activity Audit Trail (Priority: P6)

As an authenticated user, I want to view a history of all actions taken on my tasks so that I have full traceability of task changes.

**Why this priority**: Audit trail is a value-add feature that depends on the event infrastructure being in place. It enhances accountability but is not required for core task management.

**Independent Test**: Can be fully tested by performing several task operations (create, update, complete, delete) and then querying the audit history to verify all actions are recorded with timestamps.

**Acceptance Scenarios**:

1. **Given** I create a task, **When** I view the audit history for that task, **Then** a "created" event is recorded with a timestamp.
2. **Given** I update a task's title, **When** I view the audit history, **Then** an "updated" event is recorded showing the change.
3. **Given** I complete a task, **When** I view the audit history, **Then** a "completed" event is recorded.
4. **Given** I delete a task, **When** I view the audit history, **Then** a "deleted" event is recorded and the history remains accessible.
5. **Given** another user performs actions on their tasks, **When** I view my audit history, **Then** I see only events related to my own tasks.

---

### Edge Cases

- What happens when a recurring task is completed but the event broker is temporarily unavailable? The completion succeeds, and the event is retried until the next occurrence is eventually created (at-least-once delivery guarantee).
- What happens when a reminder is scheduled but the notification service is down? The reminder event is queued and delivered when the service recovers.
- What happens when a user sets a due date in the past? The system accepts the task but does not schedule a reminder for a past time.
- What happens when a task with a recurring pattern is deleted (not completed)? No next occurrence is generated — only completion triggers recurrence.
- What happens when the WebSocket connection drops mid-update? The client reconnects and fetches the latest state to reconcile missed events.
- What happens when two users create tasks simultaneously? Each user's events are processed independently; no cross-user interference.
- What happens when a Helm deployment fails mid-rollout? The deployment performs a rollback to the last known healthy state.
- What happens when a Kafka topic has no consumers? Messages are retained per the configured retention policy and processed when consumers come online.
- What happens when a pod exceeds its resource limits? Kubernetes restarts the pod and the horizontal pod autoscaler evaluates whether to add replicas.

## Requirements *(mandatory)*

### Functional Requirements

**Task Enhancements**
- **FR-001**: System MUST support a `due_at` attribute on tasks storing a date and time value
- **FR-002**: System MUST support a `priority` attribute on tasks accepting values: low, medium, or high
- **FR-003**: System MUST support a `tags` attribute on tasks storing an ordered list of string labels
- **FR-004**: System MUST support an optional `recurring_pattern` attribute on tasks accepting values: daily, weekly, or monthly
- **FR-005**: System MUST allow filtering tasks by priority, tags, due date range, and completion status
- **FR-006**: System MUST allow sorting tasks by due date, priority, or creation date
- **FR-007**: System MUST allow searching tasks by title or tag keyword

**Recurring Task Engine**
- **FR-008**: System MUST automatically create the next occurrence of a task when a recurring task is marked complete
- **FR-009**: The next occurrence MUST have its `due_at` advanced by the appropriate interval (1 day for daily, 7 days for weekly, 1 month for monthly)
- **FR-010**: The next occurrence MUST inherit the original task's priority, tags, and recurring pattern
- **FR-011**: Recurring task generation MUST be asynchronous and not block the task completion response
- **FR-012**: Only task completion (not deletion) MUST trigger recurring task generation

**Reminder System**
- **FR-013**: System MUST schedule a reminder when a task with a `due_at` value is created or updated
- **FR-014**: Reminders MUST trigger at a configurable time before the due date (default: 30 minutes)
- **FR-015**: System MUST cancel pending reminders when a task is completed, deleted, or its due date is changed
- **FR-016**: System MUST NOT use polling-based database scanning for reminder scheduling
- **FR-017**: The notification service MUST deliver reminders to the task owner

**Event-Driven Architecture**
- **FR-018**: All cross-service communication MUST occur via an event broker (message topics)
- **FR-019**: System MUST publish events to dedicated topics: task-events, reminders, task-updates
- **FR-020**: Services MUST NOT directly call other services for task event processing, notifications, or audit logging
- **FR-021**: Event delivery MUST guarantee at-least-once semantics
- **FR-022**: Application code MUST interact with the event broker through a runtime abstraction layer, not directly via broker client libraries

**Microservices**
- **FR-023**: A Recurring Task Service MUST consume task completion events and produce new task creation events
- **FR-024**: A Notification Service MUST consume reminder events and deliver notifications to users
- **FR-025**: An Audit Service MUST consume task events and maintain an immutable activity history
- **FR-026**: A WebSocket Sync Service MUST consume task update events and broadcast real-time changes to connected clients
- **FR-027**: Each service MUST operate independently — failure of one service MUST NOT prevent others from functioning

**Runtime Abstraction (Dapr)**
- **FR-028**: The runtime abstraction layer MUST provide pub/sub messaging, state management, secret management, service invocation, and scheduled jobs
- **FR-029**: Swapping the underlying infrastructure components (e.g., changing the message broker) MUST require only configuration changes, not code changes

**Cloud Deployment**
- **FR-030**: System MUST deploy to a managed Kubernetes cluster (AKS, GKE, or OKE)
- **FR-031**: Deployment MUST support multiple replicas per service
- **FR-032**: Deployment MUST support horizontal pod autoscaling based on resource utilization
- **FR-033**: All services MUST expose liveness and readiness health probes
- **FR-034**: Ingress MUST be TLS-enabled with a valid certificate
- **FR-035**: Secrets MUST be stored in Kubernetes Secrets or a dedicated secret store — never in source code or plain-text configuration

**CI/CD Pipeline**
- **FR-036**: Pipeline MUST build Docker images for all services on code push
- **FR-037**: Pipeline MUST push images to a container registry
- **FR-038**: Pipeline MUST deploy to the Kubernetes cluster via Helm
- **FR-039**: Pipeline MUST support environment-based configuration (dev, staging, production)

**Observability**
- **FR-040**: System MUST provide centralized logging aggregated from all services
- **FR-041**: System MUST provide pod-level resource metrics (CPU, memory, network)
- **FR-042**: System MUST expose health status without requiring SSH access to cluster nodes

**Security**
- **FR-043**: No secrets, tokens, or API keys MUST exist in source code or Docker image layers
- **FR-044**: Role-based access MUST be enforced where supported (Kubernetes RBAC, API authorization)

### Key Entities

- **Task** (enhanced): Represents a todo item belonging to a user. Key attributes: unique identifier, owner, title, description, completion status, due date/time, priority (low/medium/high), tags (list of labels), recurring pattern (daily/weekly/monthly or none), timestamps (created, updated, completed)
- **Task Event**: Represents a state change on a task published to the event broker. Key attributes: event type (created, updated, completed, deleted), task identifier, user identifier, timestamp, event payload (changed attributes)
- **Reminder**: Represents a scheduled notification trigger tied to a task's due date. Key attributes: task identifier, user identifier, scheduled trigger time, delivery status
- **Audit Entry**: Represents an immutable record of a task action. Key attributes: unique identifier, task identifier, user identifier, action type, change details, timestamp
- **Notification**: Represents a message delivered to a user about an upcoming deadline. Key attributes: recipient (user identifier), task reference, delivery channel, delivery status, timestamp

## Scope & Boundaries *(mandatory)*

### In Scope

- Task attribute enhancements (due date, priority, tags, recurring pattern)
- Task filtering, sorting, and search by new attributes
- Event-driven architecture with message broker (Kafka) abstracted through Dapr
- Recurring Task Service for automatic next-occurrence generation
- Notification Service for reminder delivery
- Audit Service for immutable task history
- WebSocket Sync Service for real-time client updates
- Production Kubernetes deployment (AKS, GKE, or OKE)
- Helm chart enhancements for microservices and infrastructure components
- CI/CD pipeline via GitHub Actions
- Centralized logging and pod metrics
- TLS-enabled ingress
- Horizontal pod autoscaling
- Secret management via Kubernetes Secrets or Dapr Secret Store

### Out of Scope

- Multi-user collaboration or shared task boards
- File attachments or rich media in tasks
- Voice input or speech-to-text
- AI-generated task suggestions or smart scheduling
- Multi-region or multi-cluster deployments
- Custom notification channel integrations beyond the initial implementation
- Database migration from Neon to a self-hosted database
- Mobile native applications
- Billing, payments, or subscription features
- Custom calendar integrations (Google Calendar, Outlook)

### Assumptions

- Phase III (AI Chatbot) and Phase IV (Local K8s Deployment) are complete and operational
- Neon DB remains the primary database; new tables/columns are added via migrations
- A managed Kubernetes cluster (AKS, GKE, or OKE) is provisioned and accessible
- A container registry is available for pushing Docker images
- Dapr is available as a runtime sidecar in the Kubernetes cluster
- Kafka (or a compatible message broker) is available as infrastructure in the cluster
- GitHub Actions is available for CI/CD pipeline execution
- The reminder default lead time of 30 minutes is acceptable for initial implementation
- Notification delivery initially targets in-app/web notifications (push/email can be added later)
- WebSocket connections are managed per authenticated user session

### Dependencies

- Phase III Todo AI Chatbot (frontend + backend + MCP tools) must be complete
- Phase IV Local K8s Deployment (Dockerfiles, Helm charts) must be complete
- Managed Kubernetes cluster must be provisioned
- Container registry must be configured
- Kafka (or compatible broker) must be available in the cluster
- Dapr must be installed in the Kubernetes cluster
- GitHub Actions must be configured with cluster access credentials
- TLS certificate must be available for ingress

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create tasks with due dates, priorities, tags, and recurring patterns — all attributes persist and display correctly within 5 seconds of creation
- **SC-002**: When a recurring task is completed, the next occurrence is automatically created within 10 seconds
- **SC-003**: Reminders are delivered within 60 seconds of the scheduled trigger time
- **SC-004**: Real-time task updates are visible on connected clients within 3 seconds of the change
- **SC-005**: The CI/CD pipeline completes a full build-push-deploy cycle in under 15 minutes
- **SC-006**: All pods reach Running status within 5 minutes of a Helm deployment
- **SC-007**: The system sustains 100 concurrent users without service degradation
- **SC-008**: Horizontal autoscaling activates within 2 minutes of sustained high resource usage
- **SC-009**: No sensitive credentials exist in source code, Docker images, or plain-text Kubernetes resources
- **SC-010**: Audit trail captures 100% of task state changes with no gaps
- **SC-011**: Individual service failure does not cascade — remaining services continue operating
- **SC-012**: Cluster health, logs, and metrics are observable through dashboards without SSH access

## Completion Criteria

Phase V is complete when:

- [ ] Tasks support due dates, priorities, tags, and recurring patterns
- [ ] Task filtering, sorting, and search by new attributes work correctly
- [ ] Events flow through the message broker for all task state changes
- [ ] Recurring Task Service automatically generates next occurrences on completion
- [ ] Reminder system triggers notifications at the correct times without polling
- [ ] Notification Service delivers reminders to task owners
- [ ] Audit Service records all task events immutably
- [ ] WebSocket Sync Service broadcasts real-time updates to connected clients
- [ ] All services operate independently — one service's failure does not break others
- [ ] Application deploys to a production managed Kubernetes cluster
- [ ] CI/CD pipeline builds, pushes, and deploys automatically
- [ ] TLS-enabled ingress routes external traffic securely
- [ ] Horizontal pod autoscaling adjusts replica counts based on load
- [ ] All liveness and readiness probes pass
- [ ] Centralized logging and pod metrics are accessible via dashboards
- [ ] No secrets exist in source code or unencrypted configuration
