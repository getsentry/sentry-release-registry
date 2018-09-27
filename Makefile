remove-package-links:
	rm -f $$(find apps/ packages/ -type l)
.PHONY: remove-package-links

sync-all-links: remove-package-links
	bin/sync-links $$(find apps/ packages/ sdks/ -type f | grep json)
.PHONY: sync-all-links
