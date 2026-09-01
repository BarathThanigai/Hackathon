# Redis Architecture Decision

During the March architecture meeting, the engineering team
discussed increasing database load in the authentication service.

Rahul proposed introducing Redis caching to reduce repeated
database queries.

The team agreed to introduce Redis because the authentication
service was experiencing high database load.

The decision was implemented through Pull Request #428.