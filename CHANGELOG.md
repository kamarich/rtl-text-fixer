# Changelog

All notable changes to RTL Text Fixer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-XX

### Added
- Universal website support - works on any website, not just specific domains
- Per-site enable/disable functionality for granular control
- Persistent settings that remember user preferences across browser sessions
- Visual feedback toggle to show/hide processing indicators
- Modern popup interface with real-time status updates
- Comprehensive error handling and logging
- Smart parent element detection for optimal RTL application
- Mutation observer for dynamic content handling

### Changed
- **BREAKING**: Extension now requires manual activation per site (disabled by default)
- Completely rewritten codebase for better performance and maintainability
- Improved RTL text detection algorithm with better accuracy
- Enhanced UI with clearer status indicators and controls
- More efficient DOM processing with reduced performance impact
- Better handling of edge cases and error conditions

### Fixed
- Resolved issues with UI elements being incorrectly styled as RTL
- Fixed performance problems on content-heavy websites
- Improved reliability of text direction detection
- Better handling of dynamically loaded content
- Fixed memory leaks in mutation observers

### Removed
- Automatic activation on all sites (now requires user consent per site)
- Legacy code compatibility layers
- Deprecated configuration options

## [1.3.0] - 2023-XX-XX

### Added
- Internal memory system for persistent settings
- Visual feedback with blue border indicators
- Toggle controls for extension features

### Fixed
- Extension disable functionality
- UI interference issues
- Memory persistence problems

## [1.2.0] - 2023-XX-XX

### Added
- Parent-based RTL application for better text flow
- Enhanced content detection algorithms
- Improved error handling

### Fixed
- Text alignment issues
- Performance optimizations
- DOM mutation handling

## [1.1.0] - 2023-XX-XX

### Added
- Dynamic content detection
- Improved Arabic and Persian text recognition
- Basic popup interface

### Fixed
- Initial text processing issues
- Extension activation problems

## [1.0.0] - 2023-XX-XX

### Added
- Initial release
- Basic RTL text detection for Arabic and Persian
- Simple content script injection
- Chrome extension manifest v3 support
