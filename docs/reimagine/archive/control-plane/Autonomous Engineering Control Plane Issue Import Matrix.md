# Autonomous Engineering Control Plane Issue Import Matrix

Use this table to create issues for the autonomous engineering control plane in a consistent order.

## Related Docs

- [Autonomous Engineering Control Plane for Visual Studio Code](./Autonomous%20Engineering%20Control%20Plane%20for%20Visual%20Studio%20Code.md)
- [Autonomous Engineering Control Plane Requirements](./requirements.md)
- [Autonomous Engineering Control Plane Staged Implementation Plan](./Autonomous%20Engineering%20Control%20Plane%20Staged%20Implementation%20Plan.md)
- [Autonomous Engineering Control Plane Tracker](./Autonomous%20Engineering%20Control%20Plane%20Tracker.md)

| ID | Title | Stage | Priority | Labels | Depends On | Milestone | Body File |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACP-001 | Define control-plane vocabulary | 0 | P0 | acp, stage-0, priority-p0 | None | Stage 0 | docs/reimagine/issues/ACP-001.md |
| ACP-002 | Record architecture boundaries | 0 | P0 | acp, stage-0, priority-p0 | ACP-001 | Stage 0 | docs/reimagine/issues/ACP-002.md |
| ACP-003 | Define migration posture | 0 | P0 | acp, stage-0, priority-p0 | ACP-001 | Stage 0 | docs/reimagine/issues/ACP-003.md |
| ACP-004 | Record validation contract | 0 | P1 | acp, stage-0, priority-p1 | ACP-001 | Stage 0 | docs/reimagine/issues/ACP-004.md |
| ACP-101 | Define Goal schema and model | 1 | P0 | acp, stage-1, priority-p0 | ACP-001 | Stage 1 | docs/reimagine/issues/ACP-101.md |
| ACP-102 | Add goal lifecycle services | 1 | P0 | acp, stage-1, priority-p0 | ACP-101 | Stage 1 | docs/reimagine/issues/ACP-102.md |
| ACP-103 | Add goal persistence and hydration | 1 | P0 | acp, stage-1, priority-p0 | ACP-101 | Stage 1 | docs/reimagine/issues/ACP-103.md |
| ACP-104 | Introduce basic goal commands | 1 | P1 | acp, stage-1, priority-p1 | ACP-102, ACP-103 | Stage 1 | docs/reimagine/issues/ACP-104.md |
| ACP-105 | Add structured progress tracking | 1 | P0 | acp, stage-1, priority-p0 | ACP-101, ACP-102 | Stage 1 | docs/reimagine/issues/ACP-105.md |
| ACP-201 | Implement planner service | 2 | P0 | acp, stage-2, priority-p0 | ACP-101 | Stage 2 | docs/reimagine/issues/ACP-201.md |
| ACP-202 | Add progress evaluation and replanning | 2 | P0 | acp, stage-2, priority-p0 | ACP-201, ACP-105 | Stage 2 | docs/reimagine/issues/ACP-202.md |
| ACP-203 | Add supervisory progress reporting | 2 | P1 | acp, stage-2, priority-p1 | ACP-202 | Stage 2 | docs/reimagine/issues/ACP-203.md |
| ACP-204 | Add supervision state tracking | 2 | P0 | acp, stage-2, priority-p0 | ACP-201 | Stage 2 | docs/reimagine/issues/ACP-204.md |
| ACP-205 | Bridge goal execution to current runner | 2 | P1 | acp, stage-2, priority-p1 | ACP-201, ACP-204 | Stage 2 | docs/reimagine/issues/ACP-205.md |
| ACP-301 | Implement policy engine | 3 | P0 | acp, stage-3, priority-p0 | ACP-201 | Stage 3 | docs/reimagine/issues/ACP-301.md |
| ACP-302 | Expand evidence model | 3 | P0 | acp, stage-3, priority-p0 | ACP-201 | Stage 3 | docs/reimagine/issues/ACP-302.md |
| ACP-303 | Separate claims from evidence | 3 | P0 | acp, stage-3, priority-p0 | ACP-302 | Stage 3 | docs/reimagine/issues/ACP-303.md |
| ACP-304 | Persist policy audit trail | 3 | P1 | acp, stage-3, priority-p1 | ACP-301, ACP-302 | Stage 3 | docs/reimagine/issues/ACP-304.md |
| ACP-401 | Add skills registry | 4 | P0 | acp, stage-4, priority-p0 | ACP-201 | Stage 4 | docs/reimagine/issues/ACP-401.md |
| ACP-402 | Define skill contract | 4 | P0 | acp, stage-4, priority-p0 | ACP-401 | Stage 4 | docs/reimagine/issues/ACP-402.md |
| ACP-403 | Extend agent adapter model | 4 | P0 | acp, stage-4, priority-p0 | ACP-301, ACP-402 | Stage 4 | docs/reimagine/issues/ACP-403.md |
| ACP-404 | Add agent assignment and claim tracking | 4 | P1 | acp, stage-4, priority-p1 | ACP-303, ACP-403 | Stage 4 | docs/reimagine/issues/ACP-404.md |
| ACP-501 | Add Goal view and detail experience | 5 | P0 | acp, stage-5, priority-p0 | ACP-101, ACP-105 | Stage 5 | docs/reimagine/issues/ACP-501.md |
| ACP-502 | Add plan and policy visibility | 5 | P0 | acp, stage-5, priority-p0 | ACP-201, ACP-301 | Stage 5 | docs/reimagine/issues/ACP-502.md |
| ACP-503 | Integrate evidence navigation | 5 | P1 | acp, stage-5, priority-p1 | ACP-302, ACP-303 | Stage 5 | docs/reimagine/issues/ACP-503.md |
| ACP-504 | Preserve existing workflow explorers | 5 | P0 | acp, stage-5, priority-p0 | ACP-205 | Stage 5 | docs/reimagine/issues/ACP-504.md |
| ACP-601 | Map workflows to goals | 6 | P0 | acp, stage-6, priority-p0 | ACP-101, ACP-205 | Stage 6 | docs/reimagine/issues/ACP-601.md |
| ACP-602 | Deprecate task-era concepts | 6 | P1 | acp, stage-6, priority-p1 | ACP-601 | Stage 6 | docs/reimagine/issues/ACP-602.md |
| ACP-603 | Preserve historical runs and evidence | 6 | P0 | acp, stage-6, priority-p0 | ACP-302, ACP-303 | Stage 6 | docs/reimagine/issues/ACP-603.md |
| ACP-604 | Add compatibility tests | 6 | P0 | acp, stage-6, priority-p0 | ACP-601, ACP-603 | Stage 6 | docs/reimagine/issues/ACP-604.md |
| ACP-701 | Expand automated tests | 7 | P0 | acp, stage-7, priority-p0 | ACP-202, ACP-301, ACP-302, ACP-404 | Stage 7 | docs/reimagine/issues/ACP-701.md |
| ACP-702 | Expand manual validation | 7 | P1 | acp, stage-7, priority-p1 | ACP-501, ACP-502, ACP-503 | Stage 7 | docs/reimagine/issues/ACP-702.md |
| ACP-703 | Update documentation | 7 | P1 | acp, stage-7, priority-p1 | ACP-501, ACP-502, ACP-603 | Stage 7 | docs/reimagine/issues/ACP-703.md |
| ACP-704 | Define release gates | 7 | P0 | acp, stage-7, priority-p0 | ACP-701, ACP-702, ACP-703 | Stage 7 | docs/reimagine/issues/ACP-704.md |

## Suggested Creation Order

1. ACP-001
2. ACP-002
3. ACP-003
4. ACP-004
5. ACP-101
6. ACP-102
7. ACP-103
8. ACP-104
9. ACP-105
10. ACP-201
11. ACP-202
12. ACP-203
13. ACP-204
14. ACP-205
15. ACP-301
16. ACP-302
17. ACP-303
18. ACP-304
19. ACP-401
20. ACP-402
21. ACP-403
22. ACP-404
23. ACP-501
24. ACP-502
25. ACP-503
26. ACP-504
27. ACP-601
28. ACP-602
29. ACP-603
30. ACP-604
31. ACP-701
32. ACP-702
33. ACP-703
34. ACP-704

## Notes

- Create the stage 0 issues first to lock vocabulary, architecture, migration posture, and validation rules.
- The progress-tracking work in ACP-105 should happen before deeper replanning or UI progress surfaces.
- Keep `docs/reimagine/Autonomous Engineering Control Plane Tracker.md` as the working status source of truth once work starts.