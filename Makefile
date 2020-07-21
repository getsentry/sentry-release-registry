remove-package-links:
	rm -f $$(find apps/ packages/ -type l -name '*.json')
.PHONY: remove-package-links

sync-all-links: remove-package-links
	bin/sync-links $$(find apps/ packages/ sdks/ -type f -name '*.json')
.PHONY: sync-all-links
