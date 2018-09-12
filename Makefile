sync-all-links:
	bin/sync-links $$(find packages/ sdks/ -type f | grep json)

remove-package-links: 
	rm -f $$(find packages/ -type l)

rebuild-links:
	$(MAKE) remove-package-links sync-all-links
