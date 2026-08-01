# Reimagine Issue Import Matrix

Use this table to create GitHub issues in sequence with consistent labels and milestone suggestions.

| ID | Title | Stage | Priority | Labels | Depends On | Milestone | Body File |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RIM-001 | Create migration branch and lock initial scope | 0 | P0 | reimagine, stage-0, priority-p0 | None | Stage 0 | docs/reimagine/issues/RIM-001.md |
| RIM-002 | Record architecture decision log (ADRs) | 0 | P0 | reimagine, stage-0, priority-p0 | RIM-001 | Stage 0 | docs/reimagine/issues/RIM-002.md |
| RIM-003 | Define run-state vocabulary and terminal statuses | 0 | P0 | reimagine, stage-0, priority-p0 | RIM-001 | Stage 0 | docs/reimagine/issues/RIM-003.md |
| RIM-004 | Add implementation tracker doc | 0 | P0 | reimagine, stage-0, priority-p0 | RIM-001 | Stage 0 | docs/reimagine/issues/RIM-004.md |
| RIM-101 | Rename user-facing product surfaces | 1 | P0 | reimagine, stage-1, priority-p0 | RIM-001 | Stage 1 | docs/reimagine/issues/RIM-101.md |
| RIM-102 | Remove task-domain commands and providers | 1 | P0 | reimagine, stage-1, priority-p0 | RIM-101 | Stage 1 | docs/reimagine/issues/RIM-102.md |
| RIM-103 | Introduce new view containers (Loops/Runs) | 1 | P1 | reimagine, stage-1, priority-p1 | RIM-101 | Stage 1 | docs/reimagine/issues/RIM-103.md |
| RIM-104 | Refactor activation into composition root | 1 | P1 | reimagine, stage-1, priority-p1 | RIM-102 | Stage 1 | docs/reimagine/issues/RIM-104.md |
| RIM-105 | Preserve packaging and baseline tests | 1 | P0 | reimagine, stage-1, priority-p0 | RIM-102, RIM-103, RIM-104 | Stage 1 | docs/reimagine/issues/RIM-105.md |
| RIM-201 | Define workflow schema v1 | 2 | P0 | reimagine, stage-2, priority-p0 | RIM-003 | Stage 2 | docs/reimagine/issues/RIM-201.md |
| RIM-202 | Add .huckleberry/loops discovery service | 2 | P0 | reimagine, stage-2, priority-p0 | RIM-201 | Stage 2 | docs/reimagine/issues/RIM-202.md |
| RIM-203 | Build workflow validator service | 2 | P0 | reimagine, stage-2, priority-p0 | RIM-201 | Stage 2 | docs/reimagine/issues/RIM-203.md |
| RIM-204 | Implement LoopExplorerProvider | 2 | P1 | reimagine, stage-2, priority-p1 | RIM-202, RIM-203 | Stage 2 | docs/reimagine/issues/RIM-204.md |
| RIM-205 | Add starter workflow templates | 2 | P2 | reimagine, stage-2, priority-p2 | RIM-201, RIM-203 | Stage 2 | docs/reimagine/issues/RIM-205.md |
| RIM-301 | Implement runner process and IPC contract | 3 | P0 | reimagine, stage-3, priority-p0 | RIM-201 | Stage 3 | docs/reimagine/issues/RIM-301.md |
| RIM-302 | Implement state-machine engine | 3 | P0 | reimagine, stage-3, priority-p0 | RIM-301 | Stage 3 | docs/reimagine/issues/RIM-302.md |
| RIM-303 | Add command step executor | 3 | P0 | reimagine, stage-3, priority-p0 | RIM-301, RIM-302 | Stage 3 | docs/reimagine/issues/RIM-303.md |
| RIM-304 | Persist runs/events/evidence metadata | 3 | P0 | reimagine, stage-3, priority-p0 | RIM-302 | Stage 3 | docs/reimagine/issues/RIM-304.md |
| RIM-305 | Build Runs UI timeline | 3 | P1 | reimagine, stage-3, priority-p1 | RIM-302, RIM-304 | Stage 3 | docs/reimagine/issues/RIM-305.md |
| RIM-306 | Add cancellation and failure-stop reasons | 3 | P0 | reimagine, stage-3, priority-p0 | RIM-302 | Stage 3 | docs/reimagine/issues/RIM-306.md |
| RIM-401 | Introduce AgentAdapter abstraction | 4 | P0 | reimagine, stage-4, priority-p0 | RIM-303 | Stage 4 | docs/reimagine/issues/RIM-401.md |
| RIM-402 | Implement Copilot adapter | 4 | P1 | reimagine, stage-4, priority-p1 | RIM-401 | Stage 4 | docs/reimagine/issues/RIM-402.md |
| RIM-403 | Add agent step node type | 4 | P0 | reimagine, stage-4, priority-p0 | RIM-401, RIM-201 | Stage 4 | docs/reimagine/issues/RIM-403.md |
| RIM-404 | Implement repair loop semantics | 4 | P0 | reimagine, stage-4, priority-p0 | RIM-403, RIM-303 | Stage 4 | docs/reimagine/issues/RIM-404.md |
| RIM-405 | Capture agent claims separately from evidence | 4 | P1 | reimagine, stage-4, priority-p1 | RIM-304, RIM-403 | Stage 4 | docs/reimagine/issues/RIM-405.md |
| RIM-501 | Implement approval gate step | 5 | P0 | reimagine, stage-5, priority-p0 | RIM-302, RIM-304 | Stage 5 | docs/reimagine/issues/RIM-501.md |
| RIM-502 | Build Evidence Explorer | 5 | P1 | reimagine, stage-5, priority-p1 | RIM-304 | Stage 5 | docs/reimagine/issues/RIM-502.md |
| RIM-503 | Improve diagnostics and deep-link integration | 5 | P1 | reimagine, stage-5, priority-p1 | RIM-305 | Stage 5 | docs/reimagine/issues/RIM-503.md |
| RIM-504 | Add run summary report generation | 5 | P2 | reimagine, stage-5, priority-p2 | RIM-304 | Stage 5 | docs/reimagine/issues/RIM-504.md |
| RIM-601 | Implement worktree lifecycle service | 6 | P0 | reimagine, stage-6, priority-p0 | RIM-303 | Stage 6 | docs/reimagine/issues/RIM-601.md |
| RIM-602 | Route steps through isolation context | 6 | P0 | reimagine, stage-6, priority-p0 | RIM-601, RIM-403 | Stage 6 | docs/reimagine/issues/RIM-602.md |
| RIM-603 | Add isolation visibility in UI | 6 | P1 | reimagine, stage-6, priority-p1 | RIM-602, RIM-305 | Stage 6 | docs/reimagine/issues/RIM-603.md |
| RIM-604 | Add diff evidence for isolated runs | 6 | P1 | reimagine, stage-6, priority-p1 | RIM-602, RIM-304 | Stage 6 | docs/reimagine/issues/RIM-604.md |
| RIM-701 | Comprehensive test suite expansion | 7 | P0 | reimagine, stage-7, priority-p0 | RIM-306, RIM-404, RIM-504, RIM-604 | Stage 7 | docs/reimagine/issues/RIM-701.md |
| RIM-702 | Resilience and recovery testing | 7 | P0 | reimagine, stage-7, priority-p0 | RIM-304, RIM-701 | Stage 7 | docs/reimagine/issues/RIM-702.md |
| RIM-703 | Telemetry and observability baseline | 7 | P1 | reimagine, stage-7, priority-p1 | RIM-305 | Stage 7 | docs/reimagine/issues/RIM-703.md |
| RIM-704 | Security and policy review | 7 | P0 | reimagine, stage-7, priority-p0 | RIM-403, RIM-602 | Stage 7 | docs/reimagine/issues/RIM-704.md |
| RIM-705 | Documentation pack | 7 | P1 | reimagine, stage-7, priority-p1 | RIM-205, RIM-504 | Stage 7 | docs/reimagine/issues/RIM-705.md |
| RIM-706 | Release checklist and go/no-go gate | 7 | P0 | reimagine, stage-7, priority-p0 | RIM-701, RIM-702, RIM-703, RIM-704, RIM-705 | Stage 7 | docs/reimagine/issues/RIM-706.md |

## Suggested Creation Order

1. RIM-001
2. RIM-002
3. RIM-003
4. RIM-004
5. RIM-101
6. RIM-102
7. RIM-103
8. RIM-104
9. RIM-105
10. RIM-201
11. RIM-202
12. RIM-203
13. RIM-204
14. RIM-205
15. RIM-301
16. RIM-302
17. RIM-303
18. RIM-304
19. RIM-305
20. RIM-306
21. RIM-401
22. RIM-402
23. RIM-403
24. RIM-404
25. RIM-405
26. RIM-501
27. RIM-502
28. RIM-503
29. RIM-504
30. RIM-601
31. RIM-602
32. RIM-603
33. RIM-604
34. RIM-701
35. RIM-702
36. RIM-703
37. RIM-704
38. RIM-705
39. RIM-706
